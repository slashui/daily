document.addEventListener('DOMContentLoaded', function() {
  // 显示当前日期
  const today = new Date();
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  const dateHeader = document.getElementById('date-header');
  dateHeader.textContent = today.toLocaleDateString('zh-CN', dateOptions);

  // 获取任务数据
  fetchTasks();
});

function fetchTasks() {
  const apiUrl = 'https://project-workbench-api.bassnova.workers.dev/api/daily-workbench';
  const contentDiv = document.getElementById('content');

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('网络请求失败');
      }
      return response.json();
    })
    .then(data => {
      if (data && data.length > 0) {
        displayTasks(data);
      } else {
        contentDiv.innerHTML = '<div class="error">没有找到任务</div>';
      }
    })
    .catch(error => {
      console.error('获取任务失败:', error);
      contentDiv.innerHTML = `<div class="error">获取任务失败: ${error.message}</div>`;
    });
}

function displayTasks(tasks) {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = '';

  // 按项目分组任务
  const projectGroups = {};
  
  tasks.forEach(task => {
    const projectId = task.project_id;
    if (!projectGroups[projectId]) {
      projectGroups[projectId] = {
        projectName: task.project.name,
        tasks: []
      };
    }
    projectGroups[projectId].tasks.push(task);
  });

  // 为每个项目创建任务组
  for (const projectId in projectGroups) {
    const group = projectGroups[projectId];
    const projectGroup = document.createElement('div');
    projectGroup.className = 'project-group';

    // 项目标题
    const projectHeader = document.createElement('div');
    projectHeader.className = 'project-header';
    projectHeader.textContent = group.projectName;
    projectGroup.appendChild(projectHeader);

    // 项目任务
    group.tasks.forEach(task => {
      const taskItem = document.createElement('div');
      taskItem.className = 'task-item';
      
      // 复选框
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'task-checkbox';
      checkbox.checked = task.is_completed;
      checkbox.disabled = true; // 只读模式
      taskItem.appendChild(checkbox);
      
      // 任务内容
      const taskContent = document.createElement('span');
      taskContent.textContent = task.content;
      if (task.is_completed) {
        taskContent.className = 'task-completed';
      }
      taskItem.appendChild(taskContent);
      
      projectGroup.appendChild(taskItem);
    });

    contentDiv.appendChild(projectGroup);
  }
}