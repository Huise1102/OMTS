-- ============================================================
-- 迁移脚本：订单支付超时（待支付 15 分钟窗口）
-- 适用：已按旧版 init.sql 建库的环境，手动执行一次即可
-- 新装环境无需执行（init.sql 已包含该字段）
-- ============================================================

ALTER TABLE `orders`
  ADD COLUMN `expire_at` DATETIME NULL COMMENT '支付截止时间' AFTER `paid_at`,
  ADD KEY `idx_expire` (`expire_at`);

-- 历史待支付订单按创建时间补 15 分钟支付窗口
UPDATE `orders`
  SET `expire_at` = DATE_ADD(`created_at`, INTERVAL 15 MINUTE)
  WHERE `status` = 0 AND `expire_at` IS NULL;
