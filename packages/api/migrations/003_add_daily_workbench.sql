-- CreateTable
CREATE TABLE "DailyWorkbench" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "todo_id" TEXT NOT NULL,
    "work_date" TEXT NOT NULL,
    "added_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyWorkbench_todo_id_fkey" FOREIGN KEY ("todo_id") REFERENCES "Todo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyWorkbench_todo_id_work_date_key" ON "DailyWorkbench"("todo_id", "work_date");