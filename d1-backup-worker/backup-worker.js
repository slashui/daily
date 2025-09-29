/**
 * Cloudflare Worker 定期备份 D1 数据库到 R2 存储
 * 
 * 此 Worker 每天自动备份 D1 数据库并将备份文件存储到 R2 存储桶中
 */

// 环境变量配置:
// - D1_DATABASE_NAME: D1 数据库的名称
// - R2_BUCKET_NAME: R2 存储桶的名称
// - BACKUP_PREFIX: 备份文件名前缀 (可选，默认为 "backup")
// - RETENTION_DAYS: 保留备份的天数 (可选，默认为 30)

export default {
  // 配置 Worker 使用 Cron 触发器，默认每天凌晨 2 点运行
  scheduled: {
    cron: '0 2 * * *', // 每天凌晨 2 点
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
    
    // 获取所有表名，排除系统表
    const tablesResult = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'"
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
    
    // 3. 清理旧备份（基于时间和数量限制）
    const retentionDays = parseInt(env.RETENTION_DAYS || '7', 10);
    const maxBackups = parseInt(env.MAX_BACKUPS || '10', 10);
    
    // 列出所有备份
    const objects = await r2.list({ prefix: backupPrefix });
    const backupFiles = objects.objects || [];
    
    // 按照上传时间排序（从最新到最旧）
    backupFiles.sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));
    
    // 处理基于时间的清理
    if (retentionDays > 0) {
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - retentionDays);
      
      // 删除过期备份
      for (const object of backupFiles) {
        const objectDate = new Date(object.uploaded);
        if (objectDate < retentionDate) {
          console.log(`Deleting old backup (time-based): ${object.key}`);
          await r2.delete(object.key);
        }
      }
    }
    
    // 处理基于数量的清理
    if (maxBackups > 0 && backupFiles.length > maxBackups) {
      // 只保留最新的 maxBackups 个备份，删除多余的
      const filesToDelete = backupFiles.slice(maxBackups);
      for (const object of filesToDelete) {
        console.log(`Deleting old backup (count-based): ${object.key}`);
        await r2.delete(object.key);
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