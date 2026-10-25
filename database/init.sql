-- ============================================================
-- 电影院在线购票系统 - 数据库初始化脚本
-- 版本: v1.0   数据库: cinema_db   字符集: utf8mb4
-- 说明: 可整体导入 MySQL 8.x；含建表、索引、示例数据、座位生成存储过程
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `cinema_db`
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `cinema_db`;

-- ================= 1. 用户表 =================
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id`         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username`   VARCHAR(50)  NOT NULL                COMMENT '登录账号',
  `password`   VARCHAR(100) NOT NULL                COMMENT '密码（bcrypt 加密）',
  `nickname`   VARCHAR(50)  DEFAULT NULL            COMMENT '昵称',
  `phone`      VARCHAR(20)  DEFAULT NULL            COMMENT '手机号',
  `avatar`     VARCHAR(255) DEFAULT NULL            COMMENT '头像 URL',
  `role`       TINYINT      NOT NULL DEFAULT 0      COMMENT '角色：0 用户 / 1 管理员',
  `status`     TINYINT      NOT NULL DEFAULT 1      COMMENT '状态：1 正常 / 0 禁用',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ================= 2. 影片类型表 =================
DROP TABLE IF EXISTS `category`;
CREATE TABLE `category` (
  `id`         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '类型ID',
  `name`       VARCHAR(50) NOT NULL                COMMENT '类型名称',
  `sort`       INT         NOT NULL DEFAULT 0      COMMENT '排序权重',
  `created_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='影片类型表';

-- ================= 3. 影片表 =================
DROP TABLE IF EXISTS `movie`;
CREATE TABLE `movie` (
  `id`           BIGINT        NOT NULL AUTO_INCREMENT COMMENT '影片ID',
  `title`        VARCHAR(100)  NOT NULL                COMMENT '片名',
  `director`     VARCHAR(50)   DEFAULT NULL            COMMENT '导演',
  `actors`       VARCHAR(255)  DEFAULT NULL            COMMENT '主演（逗号分隔）',
  `duration`     INT           NOT NULL DEFAULT 0      COMMENT '时长（分钟）',
  `release_date` DATE          DEFAULT NULL            COMMENT '上映日期',
  `language`     VARCHAR(255)  DEFAULT '国语'          COMMENT '语言/字幕版本',
  `version`      VARCHAR(20)   NOT NULL DEFAULT '2D'   COMMENT '放映版本：2D/3D/IMAX',
  `rating`       DECIMAL(3,1)  NOT NULL DEFAULT 0.0    COMMENT '评分 0-10',
  `description`  TEXT                                  COMMENT '剧情简介',
  `poster_url`   VARCHAR(255)  DEFAULT NULL            COMMENT '海报 URL',
  `status`       TINYINT       NOT NULL DEFAULT 1      COMMENT '状态：1 热映 / 2 即将上映',
  `is_hot`       TINYINT       NOT NULL DEFAULT 0      COMMENT '是否热门推荐：1 是 / 0 否',
  `box_office`   DECIMAL(12,2) NOT NULL DEFAULT 0.00   COMMENT '累计票房（万元）',
  `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_rating` (`rating`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='影片表';

-- ================= 4. 影片-类型关联表 =================
DROP TABLE IF EXISTS `movie_category`;
CREATE TABLE `movie_category` (
  `id`          BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  `movie_id`    BIGINT NOT NULL COMMENT '影片ID',
  `category_id` BIGINT NOT NULL COMMENT '类型ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_movie_category` (`movie_id`, `category_id`),
  KEY `idx_category` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='影片-类型关联表';

-- ================= 5. 影院表 =================
DROP TABLE IF EXISTS `cinema`;
CREATE TABLE `cinema` (
  `id`        BIGINT        NOT NULL AUTO_INCREMENT COMMENT '影院ID',
  `name`      VARCHAR(100)  NOT NULL                COMMENT '影院名称',
  `address`   VARCHAR(255)  DEFAULT NULL            COMMENT '地址',
  `city`      VARCHAR(50)   DEFAULT NULL            COMMENT '城市',
  `phone`     VARCHAR(20)   DEFAULT NULL            COMMENT '联系电话',
  `longitude` DECIMAL(10,6) DEFAULT NULL            COMMENT '经度',
  `latitude`  DECIMAL(10,6) DEFAULT NULL            COMMENT '纬度',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_city` (`city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='影院表';

-- ================= 6. 影厅表 =================
DROP TABLE IF EXISTS `hall`;
CREATE TABLE `hall` (
  `id`          BIGINT      NOT NULL AUTO_INCREMENT COMMENT '影厅ID',
  `cinema_id`   BIGINT      NOT NULL                COMMENT '所属影院ID',
  `name`        VARCHAR(50) NOT NULL                COMMENT '影厅名称',
  `rows`        INT         NOT NULL DEFAULT 0      COMMENT '座位行数',
  `cols`        INT         NOT NULL DEFAULT 0      COMMENT '座位列数',
  `total_seat`  INT         NOT NULL DEFAULT 0      COMMENT '总座位数',
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_cinema` (`cinema_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='影厅表';

-- ================= 7. 座位表 =================
DROP TABLE IF EXISTS `seat`;
CREATE TABLE `seat` (
  `id`        BIGINT      NOT NULL AUTO_INCREMENT COMMENT '座位ID',
  `hall_id`   BIGINT      NOT NULL                COMMENT '所属影厅ID',
  `seat_row`  INT         NOT NULL                COMMENT '行号',
  `seat_col`  INT         NOT NULL                COMMENT '列号',
  `seat_type` VARCHAR(20) NOT NULL DEFAULT '普通' COMMENT '座位类型：普通/情侣/无障碍',
  `status`    TINYINT     NOT NULL DEFAULT 1      COMMENT '状态：1 可用 / 0 禁用',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_hall_row_col` (`hall_id`, `seat_row`, `seat_col`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='座位表';

-- ================= 8. 场次表 =================
DROP TABLE IF EXISTS `showtime`;
CREATE TABLE `showtime` (
  `id`           BIGINT        NOT NULL AUTO_INCREMENT COMMENT '场次ID',
  `movie_id`     BIGINT        NOT NULL                COMMENT '影片ID',
  `cinema_id`    BIGINT        NOT NULL                COMMENT '影院ID',
  `hall_id`      BIGINT        NOT NULL                COMMENT '影厅ID',
  `show_date`    DATE          NOT NULL                COMMENT '放映日期',
  `show_time`    TIME          NOT NULL                COMMENT '放映时间',
  `version`      VARCHAR(20)   NOT NULL DEFAULT '2D'   COMMENT '放映版本',
  `price`        DECIMAL(10,2) NOT NULL DEFAULT 0.00   COMMENT '票价',
  `origin_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00   COMMENT '原价',
  `total_seat`   INT           NOT NULL DEFAULT 0      COMMENT '总座位数',
  `sold_seat`    INT           NOT NULL DEFAULT 0      COMMENT '已售座位数',
  `status`       TINYINT       NOT NULL DEFAULT 1      COMMENT '状态：1 可售 / 0 停售',
  `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_movie_date` (`movie_id`, `show_date`),
  KEY `idx_cinema` (`cinema_id`),
  KEY `idx_hall` (`hall_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='场次表';

-- ================= 9. 订单表 =================
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id`           BIGINT        NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no`     VARCHAR(32)   NOT NULL                COMMENT '订单号',
  `user_id`      BIGINT        NOT NULL                COMMENT '用户ID',
  `movie_id`     BIGINT        NOT NULL                COMMENT '影片ID',
  `cinema_id`    BIGINT        NOT NULL                COMMENT '影院ID',
  `hall_id`      BIGINT        NOT NULL                COMMENT '影厅ID',
  `showtime_id`  BIGINT        NOT NULL                COMMENT '场次ID',
  `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00   COMMENT '总金额',
  `ticket_qty`   INT           NOT NULL DEFAULT 1      COMMENT '购票数量',
  `status`       TINYINT       NOT NULL DEFAULT 0      COMMENT '状态：0待支付 1已支付 2已完成 3已退票 4已取消',
  `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '下单时间',
  `paid_at`      DATETIME      DEFAULT NULL            COMMENT '支付时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_showtime` (`showtime_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- ================= 10. 订单明细（票）表 =================
DROP TABLE IF EXISTS `order_item`;
CREATE TABLE `order_item` (
  `id`          BIGINT        NOT NULL AUTO_INCREMENT COMMENT '明细ID',
  `order_id`    BIGINT        NOT NULL                COMMENT '订单ID',
  `showtime_id` BIGINT        NOT NULL                COMMENT '场次ID',
  `seat_id`     BIGINT        NOT NULL                COMMENT '座位ID',
  `price`       DECIMAL(10,2) NOT NULL DEFAULT 0.00   COMMENT '该票价格',
  `qr_code`     VARCHAR(255)  DEFAULT NULL            COMMENT '取票二维码内容',
  `status`      TINYINT       NOT NULL DEFAULT 1      COMMENT '状态：1 有效 / 0 已退',
  `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_showtime` (`showtime_id`),
  KEY `idx_seat` (`seat_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单明细（票）表';

-- ================= 11. 轮播图表 =================
DROP TABLE IF EXISTS `banner`;
CREATE TABLE `banner` (
  `id`         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  `title`      VARCHAR(100) DEFAULT NULL            COMMENT '标题',
  `image_url`  VARCHAR(255) NOT NULL                COMMENT '图片 URL',
  `link_type`  VARCHAR(20)  DEFAULT 'movie'         COMMENT '跳转类型：movie/cinema/url',
  `link_id`    BIGINT       DEFAULT NULL            COMMENT '跳转目标ID',
  `sort`       INT          NOT NULL DEFAULT 0      COMMENT '排序权重',
  `status`     TINYINT      NOT NULL DEFAULT 1      COMMENT '状态：1 上架 / 0 下架',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='轮播图表';

-- ================= 12. 收藏表 =================
DROP TABLE IF EXISTS `favorite`;
CREATE TABLE `favorite` (
  `id`         BIGINT   NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id`    BIGINT   NOT NULL COMMENT '用户ID',
  `movie_id`   BIGINT   NOT NULL COMMENT '影片ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_movie` (`user_id`, `movie_id`),
  KEY `idx_movie` (`movie_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏表';

-- ================= 13. 智能对话-会话表 =================
DROP TABLE IF EXISTS `chat_session`;
CREATE TABLE `chat_session` (
  `id`         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `session_id` VARCHAR(64)  NOT NULL                COMMENT '会话标识（UUID）',
  `user_id`    BIGINT       NOT NULL                COMMENT '用户ID',
  `title`      VARCHAR(100) DEFAULT NULL            COMMENT '会话标题',
  `status`     TINYINT      NOT NULL DEFAULT 1      COMMENT '状态：1 进行中 / 0 已结束',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_session_id` (`session_id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='智能对话-会话表';

-- ================= 14. 智能对话-消息表 =================
DROP TABLE IF EXISTS `chat_message`;
CREATE TABLE `chat_message` (
  `id`          BIGINT      NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `session_id`  VARCHAR(64) NOT NULL                COMMENT '所属会话标识',
  `role`        VARCHAR(20) NOT NULL                COMMENT '角色：user/assistant/tool',
  `content`     TEXT                                COMMENT '消息内容',
  `tool_name`   VARCHAR(50) DEFAULT NULL            COMMENT '调用的工具名',
  `tool_args`   JSON        DEFAULT NULL            COMMENT '工具参数 JSON',
  `tool_result` TEXT        DEFAULT NULL            COMMENT '工具执行结果',
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_session` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='智能对话-消息表';

-- ================= 座位生成存储过程 =================
-- 为指定影厅批量生成 rows × cols 的座位（默认普通座、可用）
DROP PROCEDURE IF EXISTS `gen_seats`;
DELIMITER $$
CREATE PROCEDURE `gen_seats`(IN p_hall_id BIGINT, IN p_rows INT, IN p_cols INT)
BEGIN
  DECLARE r INT DEFAULT 1;
  DECLARE c INT DEFAULT 1;
  WHILE r <= p_rows DO
    SET c = 1;
    WHILE c <= p_cols DO
      INSERT INTO `seat`(`hall_id`, `seat_row`, `seat_col`, `seat_type`, `status`)
      VALUES (p_hall_id, r, c, '普通', 1);
      SET c = c + 1;
    END WHILE;
    SET r = r + 1;
  END WHILE;
END$$
DELIMITER ;

-- ================= 示例数据 =================
-- 演示用户（密码 123456 的 bcrypt 密文，可直接登录：testuser / 123456）
INSERT INTO `user`(`username`,`password`,`nickname`,`phone`,`role`) VALUES
('testuser', '$2a$10$Z44l6p9hy27K6.XthC5NBOV1iWeK1gu.ehqWrhrRqJWFozbNLuLIe', '测试用户', '13800000000', 0);

-- 影片类型 / 影片 / 类型关联 / 场次 / 轮播图 等数据
-- 已独立抽离至同目录的 seed_movies.sql（102 部真实经典影片，仅元数据，无图片/影片文件）。
-- 导入本文件（init.sql）完成后，请继续导入 seed_movies.sql；
-- 或在命令行执行：node database/seed_movies.js（自动导入，并重新生成 seed_movies.sql）。

-- 影院
INSERT INTO `cinema`(`name`,`address`,`city`,`phone`,`longitude`,`latitude`) VALUES
('星辉影城（中心城店）','示例市朝阳路88号','示例市','0755-88886666',116.400000,39.900000),
('星辉影城（科技园店）','示例市科苑路12号','示例市','0755-88887777',116.380000,39.910000);

-- 影厅
INSERT INTO `hall`(`cinema_id`,`name`,`rows`,`cols`,`total_seat`) VALUES
(1,'1号激光厅',6,8,48),
(1,'2号巨幕厅',8,10,80),
(2,'1号IMAX厅',8,10,80),
(1,'3号杜比厅',8,10,80),
(1,'4号亲子厅',6,8,48),
(2,'2号激光厅',6,8,48),
(2,'3号VIP厅',6,6,36);

-- 生成座位
CALL gen_seats(1,6,8);
CALL gen_seats(2,8,10);
CALL gen_seats(3,8,10);
CALL gen_seats(4,8,10);
CALL gen_seats(5,6,8);
CALL gen_seats(6,6,8);
CALL gen_seats(7,6,6);

SET FOREIGN_KEY_CHECKS = 1;