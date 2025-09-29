# Cloudflare D1 数据库自动备份到 R2 存储教程

这个教程将指导您如何设置一个 Cloudflare Worker，用于定期备份 D1 数据库并将备份文件存储到 R2 存储桶中。这是一个通用解决方案，可以应用于任何使用 Cloudflare D1 数据库的项目。

## 前提条件

- 已有 Cloudflare 账户
- 已创建 D1 数据库
- 已创建 R2 存储桶
- 已安装 Wrangler CLI (`npm install -g wrangler`)

## 步骤 1: 创建 Worker 项目

1. 创建一个新的目录用于备份 Worker：

```bash
mkdir d1-backup-worker
cd d1-backup-worker
```

2. 初始化 Worker 项目：

```bash
wrangler init
```

选择以下选项：
- JavaScript
- 不使用 TypeScript
- 不使用 Git
- 不安装依赖项

## 步骤 2: 配置 wrangler.toml

创建或编辑 `wrangler.toml` 文件，添加以下配置：

```toml
name = "d1-backup-worker"
main = "src/index.js"
compatibility_date = "2023-10-30"

# 触发器配置 - 每周日凌晨 2 点运行
[triggers]
crons = ["0 2 * * 0"]

# 绑定 D1 数据库
[[d1_databases]]
binding = "DB"  # 这个名称在 Worker 代码中使用
database_name = "your-database-name"  # 替换为您的 D1 数据库名称
database_id = "your-database-id"  # 替换为您的 D1 数据库 ID

# 绑定 R2 存储桶
[[r2_buckets]]
binding = "BUCKET"  # 这个名称在 Worker 代码中使用
bucket_name = "your-bucket-name"  # 替换为您的 R2 存储桶名称

# 环境变量
[vars]
D1_DATABASE_NAME = "your-database-name"  # 替换为您的 D1 数据库名称
R2_BUCKET_NAME = "your-bucket-name"  # 替换为您的 R2 存储桶名称
BACKUP_PREFIX = "db-backup"  # 备份文件名前缀
RETENTION_DAYS = "30"  # 保留备份的天数
```

## 步骤 3: 创建 Worker 代码

将以下代码保存到 `src/index.js` 文件中：

```javascript
/**
 * Cloudflare Worker 定期备份 D1 数据库到 R2 存储
 * 
 * 此 Worker 每周自动备份 D1 数据库并将备份文件存储到 R2 存储桶中
 */

export default {
  // 配置 Worker 使用 Cron 触发器，默认每周日凌晨 2 点运行
  scheduled: {
    cron: '0 2 * * 0', // 每周日凌晨 2 点
  },

  // 绑定 D1 数据库和 R2 存储桶
  async fetch(request, env, ctx) {
    // 处理手动触发备份的 HTTP 请求
    if (request.method === 'POST') {
      const url = new URL(request.url);
      if (url.pathname === '/backup') {
        try {
          const result = await this.backup(env);
          return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // 默认响应
    return new Response('Backup Worker is running. POST to /backup to trigger a backup manually.');
  },

  // 定时任务处理函数
  async scheduled(event, env, ctx) {
    try {
      await this.backup(env);
      console.log('Scheduled backup completed successfully');
    } catch (error) {
      console.error('Scheduled backup failed:', error);
    }
  },

  // 备份核心逻辑
  async backup(env) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPrefix = env.BACKUP_PREFIX || 'backup';
    const backupFileName = `${backupPrefix}-${timestamp}.sql`;
    
    console.log(`Starting backup to ${backupFileName}`);
    
    // 1. 导出 D1 数据库
    const db = env.DB; // 确保在 wrangler.toml 中配置了 DB 绑定
    if (!db) {
      throw new Error('D1 database binding not found');
    }
    
    // 获取所有表名
    const tablesResult = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).all();
    
    if (!tablesResult.results || tablesResult.results.length === 0) {
      throw new Error('No tables found in database');
    }
    
    // 构建 SQL 导出内容
    let sqlContent = '';
    
    // 添加 SQL 文件头部注释
    sqlContent += `-- D1 Database Backup\n`;
    sqlContent += `-- Generated: ${new Date().toISOString()}\n`;
    sqlContent += `-- Database: ${env.D1_DATABASE_NAME || 'unknown'}\n\n`;
    
    // 处理每个表
    for (const tableObj of tablesResult.results) {
      const tableName = tableObj.name;
      
      // 获取表结构
      const tableSchemaResult = await db.prepare(`SELECT sql FROM sqlite_master WHERE name = ?`).bind(tableName).first();
      if (tableSchemaResult && tableSchemaResult.sql) {
        sqlContent += `-- Table structure for ${tableName}\n`;
        sqlContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
        sqlContent += `${tableSchemaResult.sql};\n\n`;
        
        // 获取表数据
        const tableDataResult = await db.prepare(`SELECT * FROM \`${tableName}\``).all();
        
        if (tableDataResult.results && tableDataResult.results.length > 0) {
          sqlContent += `-- Data for table ${tableName}\n`;
          
          // 获取列名
          const columns = Object.keys(tableDataResult.results[0]);
          
          // 为每一行生成 INSERT 语句
          for (const row of tableDataResult.results) {
            const values = columns.map(col => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              return val;
            });
            
            sqlContent += `INSERT INTO \`${tableName}\` (${columns.map(c => `\`${c}\``).join(', ')}) VALUES (${values.join(', ')});\n`;
          }
          sqlContent += '\n';
        }
      }
    }
    
    // 2. 上传到 R2 存储
    const r2 = env.BUCKET; // 确保在 wrangler.toml 中配置了 BUCKET 绑定
    if (!r2) {
      throw new Error('R2 bucket binding not found');
    }
    
    await r2.put(backupFileName, sqlContent, {
      httpMetadata: {
        contentType: 'application/sql',
      },
    });
    
    // 3. 清理旧备份（如果配置了保留期）
    const retentionDays = parseInt(env.RETENTION_DAYS || '30', 10);
    if (retentionDays > 0) {
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - retentionDays);
      
      // 列出所有备份
      const objects = await r2.list({ prefix: backupPrefix });
      
      // 删除过期备份
      for (const object of objects.objects) {
        const objectDate = new Date(object.uploaded);
        if (objectDate < retentionDate) {
          console.log(`Deleting old backup: ${object.key}`);
          await r2.delete(object.key);
        }
      }
    }
    
    return {
      success: true,
      filename: backupFileName,
      timestamp: timestamp,
      size: sqlContent.length,
    };
  }
};
```

## 步骤 4: 部署 Worker

使用以下命令部署 Worker：

```bash
wrangler deploy
```

## 步骤 5: 测试备份功能

您可以通过发送 POST 请求到 Worker 的 `/backup` 端点来手动触发备份：

```bash
curl -X POST https://d1-backup-worker.<your-worker-subdomain>.workers.dev/backup
```

或者使用 Wrangler 直接触发：

```bash
wrangler tail
```

然后在另一个终端中：

```bash
curl -X POST https://d1-backup-worker.<your-worker-subdomain>.workers.dev/backup
```

## 步骤 6: 验证备份文件

登录 Cloudflare 控制台，导航到 R2 存储桶，您应该能看到生成的备份文件。

## 自定义配置

您可以通过修改 `wrangler.toml` 中的环境变量来自定义备份行为：

- `BACKUP_PREFIX`: 备份文件名前缀
- `RETENTION_DAYS`: 保留备份的天数

您也可以修改 cron 表达式来更改备份频率，例如：

- `0 2 * * *`: 每天凌晨 2 点
- `0 2 * * 1-5`: 每个工作日凌晨 2 点
- `0 2 1 * *`: 每月 1 日凌晨 2 点

## 故障排除

如果备份失败，请检查以下几点：

1. 确保 D1 数据库和 R2 存储桶的绑定正确
2. 检查 Worker 日志中的错误信息
3. 验证 Worker 有足够的权限访问 D1 数据库和 R2 存储桶

## 恢复备份

要恢复备份，您可以：

1. 从 R2 存储桶下载备份文件
2. 使用 Wrangler 执行 SQL 文件：

```bash
wrangler d1 execute <your-database-name> --file=<backup-file.sql>
```

## 安全注意事项

- 备份文件包含数据库的完整内容，请确保 R2 存储桶配置了适当的访问控制
- 考虑为备份文件启用加密
- 定期验证备份的有效性，确保在需要时可以成功恢复

## 限制和注意事项

- 对于大型数据库，可能需要考虑分批导出数据以避免超出 Worker 的资源限制
- Worker 的执行时间限制为 30 秒，对于非常大的数据库可能需要更复杂的解决方案
- 此备份方法适用于中小型数据库，对于大型数据库，请考虑使用 Cloudflare 的官方备份功能或其他专业备份解决方案