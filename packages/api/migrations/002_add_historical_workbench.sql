-- CreateTable
CREATE TABLE "HistoricalWorkbench" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workbench_date" TEXT NOT NULL,
    "snapshot_data" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "HistoricalWorkbench_workbench_date_key" ON "HistoricalWorkbench"("workbench_date");