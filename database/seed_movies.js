// database/seed_movies.js
// 生成 102 部真实经典影片数据（仅元数据，无图片/影片文件），直接导入 cinema_db，
// 并同时生成同目录的 seed_movies.sql 静态文件（供 init.sql 之后单独导入）。
// 运行：node database/seed_movies.js
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { format } = require('mysql2');

const DB = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '123456', // 与 server/.env 的 DB_PASSWORD 一致
  database: 'cinema_db',
  charset: 'utf8mb4',
  dateStrings: true
};

// 影片类型（扩展为 15 类，sort 递增）
const CATEGORIES = [
  '动作', '科幻', '喜剧', '动画', '剧情', '爱情', '悬疑',
  '犯罪', '战争', '历史', '奇幻', '冒险', '传记', '家庭', '惊悚'
];

// 100 部真实经典影片元数据
// 字段：title/director/actors/duration(分钟)/date/lang/version/rating/desc/types[]/status(1热映 2即将上映)/hot
const MOVIES = [
  { title: '霸王别姬', director: '陈凯歌', actors: '张国荣,张丰毅,巩俐', duration: 171, date: '1993-07-26', lang: '国语', version: '2D', rating: 9.6, desc: '两个京剧名角半世纪的悲欢离合，映射时代变迁与人性爱恨。', types: ['剧情', '爱情', '历史'], status: 1, hot: 0 },
  { title: '英雄本色', director: '吴宇森', actors: '周润发,张国荣,狄龙', duration: 96, date: '1986-08-02', lang: '国语', version: '2D', rating: 8.6, desc: '江湖兄弟情义与背叛的枪火史诗，一代人的热血记忆。', types: ['动作', '犯罪'], status: 1, hot: 0 },
  { title: '卧虎藏龙', director: '李安', actors: '周润发,杨紫琼,章子怡', duration: 120, date: '2000-07-07', lang: '国语', version: '2D', rating: 8.4, desc: '青冥剑引发的江湖恩怨，武侠与爱欲交织的东方美学。', types: ['动作', '爱情', '冒险'], status: 1, hot: 0 },
  { title: '无间道', director: '刘伟强', actors: '刘德华,梁朝伟,黄秋生', duration: 101, date: '2002-12-12', lang: '国语', version: '2D', rating: 9.3, desc: '警方与黑帮互相卧底的双面人生，一场正邪难分的心理博弈。', types: ['犯罪', '悬疑', '动作'], status: 1, hot: 0 },
  { title: '这个杀手不太冷', director: '吕克·贝松', actors: '让·雷诺,娜塔莉·波特曼', duration: 110, date: '1994-09-14', lang: '法语', version: '2D', rating: 9.4, desc: '孤独杀手与失孤少女的相依为命，冷酷外表下的温情救赎。', types: ['剧情', '犯罪', '动作'], status: 1, hot: 1 },
  { title: '教父', director: '弗朗西斯·科波拉', actors: '马龙·白兰度,阿尔·帕西诺', duration: 175, date: '1972-03-24', lang: '英语', version: '2D', rating: 9.3, desc: '黑手党柯里昂家族的权力更迭，一部关于家族与欲望的史诗。', types: ['剧情', '犯罪'], status: 1, hot: 0 },
  { title: '辛德勒的名单', director: '史蒂文·斯皮尔伯格', actors: '连姆·尼森,本·金斯利', duration: 195, date: '1993-11-30', lang: '英语', version: '2D', rating: 9.5, desc: '二战中商人辛德勒倾尽家财拯救千余名犹太人的真实故事。', types: ['剧情', '历史', '战争'], status: 1, hot: 1 },
  { title: '泰坦尼克号', director: '詹姆斯·卡梅隆', actors: '莱昂纳多·迪卡普里奥,凯特·温斯莱特', duration: 194, date: '1997-12-19', lang: '英语', version: '2D', rating: 9.4, desc: '巨轮首航遇难的末世之恋，跨越阶级的永恒爱情经典。', types: ['爱情', '剧情'], status: 1, hot: 1 },
  { title: '阿甘正传', director: '罗伯特·泽米吉斯', actors: '汤姆·汉克斯', duration: 142, date: '1994-07-06', lang: '英语', version: '2D', rating: 9.5, desc: '智商平平的阿甘以纯真善良跑过美国几十年风云岁月。', types: ['剧情', '爱情'], status: 1, hot: 1 },
  { title: '肖申克的救赎', director: '弗兰克·德拉邦特', actors: '蒂姆·罗宾斯,摩根·弗里曼', duration: 142, date: '1994-09-23', lang: '英语', version: '2D', rating: 9.7, desc: '含冤入狱的银行家以惊人毅力凿开通往自由的救赎之路。', types: ['剧情', '犯罪'], status: 1, hot: 1 },
  { title: '盗梦空间', director: '克里斯托弗·诺兰', actors: '莱昂纳多·迪卡普里奥', duration: 148, date: '2010-07-16', lang: '英语', version: '3D', rating: 9.3, desc: '造梦师潜入多层梦境植入意念，现实与梦境边界模糊。', types: ['科幻', '悬疑', '动作'], status: 1, hot: 1 },
  { title: '星际穿越', director: '克里斯托弗·诺兰', actors: '马修·麦康纳,安妮·海瑟薇', duration: 169, date: '2014-11-07', lang: '英语', version: '3D', rating: 9.4, desc: '地球濒危，宇航员穿越虫洞为人类寻找新家园的时空之旅。', types: ['科幻', '剧情', '冒险'], status: 1, hot: 0 },
  { title: '黑客帝国', director: '沃卓斯基姐妹', actors: '基努·里维斯', duration: 136, date: '1999-03-31', lang: '英语', version: '3D', rating: 9.1, desc: '矩阵世界的觉醒者尼奥，在虚拟与真实间选择红蓝药丸。', types: ['科幻', '动作'], status: 1, hot: 0 },
  { title: '2001太空漫游', director: '斯坦利·库布里克', actors: '凯尔·杜拉', duration: 149, date: '1968-04-02', lang: '英语', version: '2D', rating: 8.9, desc: '人类从猿到星际旅行的哲思寓言，科幻电影里程碑。', types: ['科幻', '冒险'], status: 2, hot: 0 },
  { title: '银翼杀手', director: '雷德利·斯科特', actors: '哈里森·福特', duration: 117, date: '1982-06-25', lang: '英语', version: '2D', rating: 8.5, desc: '未来都市中猎杀复制人的警探，追问何为真实与人性。', types: ['科幻', '惊悚'], status: 2, hot: 0 },
  { title: '机器人总动员', director: '安德鲁·斯坦顿', actors: '本·贝尔特', duration: 98, date: '2008-06-27', lang: '英语', version: '3D', rating: 9.3, desc: '清扫机器人瓦力跨越星际追寻爱，废土中的温情童话。', types: ['动画', '科幻', '冒险'], status: 1, hot: 0 },
  { title: '阿凡达', director: '詹姆斯·卡梅隆', actors: '萨姆·沃辛顿,佐伊·索尔达娜', duration: 162, date: '2009-12-18', lang: '英语', version: '3D', rating: 8.8, desc: '人类殖民潘多拉星球，退伍兵在纳美人的世界里觉醒。', types: ['科幻', '动作', '冒险'], status: 1, hot: 0 },
  { title: '回到未来', director: '罗伯特·泽米吉斯', actors: '迈克尔·J·福克斯', duration: 116, date: '1985-07-03', lang: '英语', version: '2D', rating: 8.7, desc: '少年驾驶时光机回到过去，阴差阳错撮合了父母的爱情。', types: ['科幻', '冒险', '喜剧'], status: 2, hot: 0 },
  { title: '终结者2', director: '詹姆斯·卡梅隆', actors: '阿诺·施瓦辛格', duration: 137, date: '1991-07-03', lang: '英语', version: '2D', rating: 8.8, desc: '未来机器人回到过去保护少年，终结者身份的惊天逆转。', types: ['科幻', '动作'], status: 2, hot: 0 },
  { title: '异形', director: '雷德利·斯科特', actors: '西格妮·韦弗', duration: 117, date: '1979-05-25', lang: '英语', version: '2D', rating: 8.3, desc: '太空货船遭遇致命异形，密闭空间下的恐怖求生。', types: ['科幻', '惊悚'], status: 2, hot: 0 },
  { title: '大话西游之大圣娶亲', director: '刘镇伟', actors: '周星驰,朱茵', duration: 98, date: '1995-02-14', lang: '国语', version: '2D', rating: 9.2, desc: '至尊宝与紫霞仙子的错过与遗憾，无厘头下的深情告白。', types: ['喜剧', '爱情', '奇幻'], status: 1, hot: 0 },
  { title: '喜剧之王', director: '周星驰,李力持', actors: '周星驰,张柏芝,莫文蔚', duration: 89, date: '1999-02-13', lang: '国语', version: '2D', rating: 8.8, desc: '跑龙套演员的追梦辛酸，小人物的执着与尊严。', types: ['喜剧', '剧情', '爱情'], status: 2, hot: 0 },
  { title: '疯狂的石头', director: '宁浩', actors: '郭涛,黄渤,刘桦', duration: 101, date: '2006-06-30', lang: '国语', version: '2D', rating: 8.5, desc: '一块宝玉引发的多方争夺，黑色幽默的多线叙事。', types: ['喜剧', '犯罪'], status: 2, hot: 0 },
  { title: '三傻大闹宝莱坞', director: '拉库马·希拉尼', actors: '阿米尔·汗', duration: 171, date: '2009-12-25', lang: '印地语', version: '2D', rating: 9.2, desc: '三位好友挑战应试教育，追寻真正热爱与自由人生。', types: ['喜剧', '剧情'], status: 1, hot: 0 },
  { title: '楚门的世界', director: '彼得·威尔', actors: '金·凯瑞', duration: 103, date: '1998-06-05', lang: '英语', version: '2D', rating: 9.3, desc: '金·凯瑞饰演的主角发现整个人生不过是一场电视真人秀。', types: ['剧情', '喜剧'], status: 1, hot: 0 },
  { title: '摩登时代', director: '查理·卓别林', actors: '查理·卓别林,宝莲·高黛', duration: 87, date: '1936-02-05', lang: '英语', version: '2D', rating: 9.3, desc: '工业流水线上小人物的挣扎，默片时代的喜剧巅峰。', types: ['喜剧', '剧情'], status: 2, hot: 0 },
  { title: '城市之光', director: '查理·卓别林', actors: '查理·卓别林,弗吉尼亚·切瑞尔', duration: 87, date: '1931-01-30', lang: '英语', version: '2D', rating: 9.3, desc: '流浪汉帮助卖花盲女重见光明的动人默片喜剧。', types: ['喜剧', '爱情'], status: 2, hot: 0 },
  { title: '让子弹飞', director: '姜文', actors: '姜文,葛优,周润发', duration: 132, date: '2010-12-16', lang: '国语', version: '2D', rating: 8.9, desc: '土匪冒充县长与恶霸斗智斗勇，荒诞而凌厉的西部寓言。', types: ['喜剧', '动作'], status: 2, hot: 0 },
  { title: '千与千寻', director: '宫崎骏', actors: '柊瑠美,入野自由', duration: 125, date: '2001-07-20', lang: '日语', version: '3D', rating: 9.4, desc: '少女千寻误入神灵世界，为救父母展开奇幻成长之旅。', types: ['动画', '奇幻'], status: 1, hot: 1 },
  { title: '龙猫', director: '宫崎骏', actors: '日高法子,坂本千夏', duration: 86, date: '1988-04-16', lang: '日语', version: '2D', rating: 9.2, desc: '姐妹俩在乡间邂逅森林精灵龙猫，纯真而治愈的童话。', types: ['动画', '奇幻', '家庭'], status: 1, hot: 0 },
  { title: '天空之城', director: '宫崎骏', actors: '田中真弓,横泽启子', duration: 125, date: '1986-08-02', lang: '日语', version: '2D', rating: 9.2, desc: '少年少女追寻漂浮古城拉普达，守护失落文明的秘密。', types: ['动画', '冒险', '奇幻'], status: 2, hot: 0 },
  { title: '哈尔的移动城堡', director: '宫崎骏', actors: '倍赏千惠子,木村拓哉', duration: 119, date: '2004-11-20', lang: '日语', version: '2D', rating: 9.1, desc: '被诅咒的少女与魔法师哈尔的相遇，爱与勇气破除咒语。', types: ['动画', '奇幻'], status: 2, hot: 0 },
  { title: '狮子王', director: '罗杰·阿勒斯', actors: '马修·布罗德里克', duration: 89, date: '1994-06-15', lang: '英语', version: '3D', rating: 9.1, desc: '小狮子辛巴历经流亡与成长，夺回荣耀大地的王位。', types: ['动画', '家庭'], status: 1, hot: 0 },
  { title: '疯狂动物城', director: '拜伦·霍华德', actors: '金妮弗·古德温', duration: 109, date: '2016-03-04', lang: '英语', version: '3D', rating: 9.2, desc: '兔子朱迪与狐狸尼克联手侦破奇案，追求平等的动物都市。', types: ['动画', '喜剧', '冒险'], status: 1, hot: 0 },
  { title: '大闹天宫', director: '万籁鸣', actors: '邱岳峰,富润生', duration: 114, date: '1961-12-01', lang: '国语', version: '2D', rating: 9.4, desc: '孙悟空大闹天宫的中国动画经典，民族艺术的巅峰之作。', types: ['动画', '奇幻'], status: 1, hot: 0 },
  { title: '哪吒之魔童降世', director: '饺子', actors: '吕艳婷,囧森瑟夫', duration: 110, date: '2019-07-26', lang: '国语', version: '3D', rating: 8.4, desc: '"我命由我不由天"，魔童哪吒逆天改命的热血神话。', types: ['动画', '奇幻', '喜剧'], status: 1, hot: 0 },
  { title: '寻梦环游记', director: '李·昂克里奇', actors: '安东尼·冈萨雷斯', duration: 105, date: '2017-11-22', lang: '英语', version: '3D', rating: 9.1, desc: '男孩穿越亡灵世界追逐音乐梦想，铭记才是真正的永恒。', types: ['动画', '家庭', '奇幻'], status: 1, hot: 0 },
  { title: '玩具总动员', director: '约翰·拉塞特', actors: '汤姆·汉克斯,蒂姆·艾伦', duration: 81, date: '1995-11-22', lang: '英语', version: '3D', rating: 8.5, desc: '牛仔警长与太空骑警的玩具之争，首部全CG动画长片。', types: ['动画', '家庭', '冒险'], status: 2, hot: 0 },
  { title: '活着', director: '张艺谋', actors: '葛优,巩俐', duration: 133, date: '1994-05-18', lang: '国语', version: '2D', rating: 9.3, desc: '福贵一家在大时代洪流中颠沛流离，笑泪交织的生命史诗。', types: ['剧情', '历史'], status: 1, hot: 1 },
  { title: '阳光灿烂的日子', director: '姜文', actors: '夏雨,宁静', duration: 134, date: '1994-10-14', lang: '国语', version: '2D', rating: 8.9, desc: '文革年代大院里少年们的青春躁动与理想幻灭。', types: ['剧情'], status: 2, hot: 0 },
  { title: '芙蓉镇', director: '谢晋', actors: '刘晓庆,姜文', duration: 160, date: '1986-11-01', lang: '国语', version: '2D', rating: 9.0, desc: '小镇男女在特殊岁月里的爱恨与坚守，反思历史的力作。', types: ['剧情', '历史'], status: 2, hot: 0 },
  { title: '城南旧事', director: '吴贻弓', actors: '沈洁,张丰毅', duration: 92, date: '1983-01-01', lang: '国语', version: '2D', rating: 9.0, desc: '以女孩英子的视角，追忆老北京城南的逝水年华。', types: ['剧情', '家庭'], status: 2, hot: 0 },
  { title: '死亡诗社', director: '彼得·威尔', actors: '罗宾·威廉姆斯', duration: 128, date: '1989-06-02', lang: '英语', version: '2D', rating: 9.1, desc: '文学教师以诗歌唤醒学生追逐自由与自我，挑战僵化教育。', types: ['剧情'], status: 2, hot: 0 },
  { title: '美丽人生', director: '罗伯托·贝尼尼', actors: '罗伯托·贝尼尼,尼可莱塔·布拉斯基', duration: 116, date: '1997-12-20', lang: '意大利语', version: '2D', rating: 9.5, desc: '父亲以游戏之名守护儿子的纯真，用爱对抗集中营的黑暗。', types: ['剧情', '战争', '爱情'], status: 1, hot: 1 },
  { title: '海上钢琴师', director: '朱塞佩·托纳多雷', actors: '蒂姆·罗斯', duration: 165, date: '1998-10-28', lang: '意大利语', version: '2D', rating: 9.3, desc: '一生未曾下船的钢琴天才，在琴键与大海间寻找归宿。', types: ['剧情'], status: 2, hot: 0 },
  { title: '天堂电影院', director: '朱塞佩·托纳多雷', actors: '菲利普·努瓦雷', duration: 155, date: '1988-11-17', lang: '意大利语', version: '2D', rating: 9.2, desc: '小镇少年与放映师的情谊，电影世界里珍藏的乡愁。', types: ['剧情'], status: 2, hot: 0 },
  { title: '触不可及', director: '奥利维埃·纳卡什', actors: '弗朗索瓦·克鲁塞,奥玛·希', duration: 112, date: '2011-11-02', lang: '法语', version: '2D', rating: 9.2, desc: '瘫痪富翁与黑人护工跨越阶层的真挚友谊，温暖而幽默。', types: ['剧情', '喜剧'], status: 2, hot: 0 },
  { title: '忠犬八公的故事', director: '莱塞·霍尔斯道姆', actors: '理查·基尔', duration: 93, date: '2009-06-13', lang: '英语', version: '2D', rating: 9.2, desc: '秋田犬八公在车站苦等逝去主人十年，忠诚感动世界。', types: ['剧情', '家庭'], status: 2, hot: 0 },
  { title: '罗马假日', director: '威廉·惠勒', actors: '奥黛丽·赫本,格利高里·派克', duration: 118, date: '1953-08-27', lang: '英语', version: '2D', rating: 9.1, desc: '出逃公主与记者在罗马的一日浪漫，永恒的爱情经典。', types: ['爱情', '喜剧'], status: 1, hot: 0 },
  { title: '魂断蓝桥', director: '茂文·勒鲁瓦', actors: '费雯·丽,罗伯特·泰勒', duration: 108, date: '1940-05-17', lang: '英语', version: '2D', rating: 9.2, desc: '战火中的邂逅与错过，滑铁卢桥上的凄美爱情绝唱。', types: ['爱情', '战争'], status: 2, hot: 0 },
  { title: '人鬼情未了', director: '杰瑞·扎克', actors: '帕特里克·斯威兹,黛米·摩尔', duration: 127, date: '1990-07-13', lang: '英语', version: '2D', rating: 8.8, desc: '遇害男主化作幽灵守护爱人，生死相隔的深情守护。', types: ['爱情', '奇幻'], status: 2, hot: 0 },
  { title: '情书', director: '岩井俊二', actors: '中山美穗,柏原崇', duration: 117, date: '1995-03-25', lang: '日语', version: '2D', rating: 8.9, desc: '一封寄往天国的情书，揭开尘封多年的青春暗恋。', types: ['爱情', '剧情'], status: 2, hot: 0 },
  { title: '爱在黎明破晓前', director: '理查德·林克莱特', actors: '伊桑·霍克,朱莉·德尔佩', duration: 101, date: '1995-01-27', lang: '英语', version: '2D', rating: 8.8, desc: '一对陌生男女在维也纳的一夜畅谈，浪漫而真挚的相遇。', types: ['爱情', '剧情'], status: 2, hot: 0 },
  { title: '花样年华', director: '王家卫', actors: '梁朝伟,张曼玉', duration: 98, date: '2000-09-29', lang: '国语', version: '2D', rating: 8.7, desc: '两对夫妻间的暧昧与克制，氤氲光影里的东方情欲。', types: ['爱情', '剧情'], status: 2, hot: 0 },
  { title: '重庆森林', director: '王家卫', actors: '金城武,梁朝伟,王菲', duration: 102, date: '1994-07-14', lang: '国语', version: '2D', rating: 8.8, desc: '都市男女的擦肩与失恋，两段疏离而迷离的情感故事。', types: ['爱情', '剧情'], status: 2, hot: 0 },
  { title: '致命魔术', director: '克里斯托弗·诺兰', actors: '休·杰克曼,克里斯蒂安·贝尔', duration: 130, date: '2006-10-20', lang: '英语', version: '2D', rating: 8.9, desc: '两位魔术师为最高机密互相残杀的黑暗对决与执念。', types: ['悬疑', '剧情'], status: 2, hot: 0 },
  { title: '看不见的客人', director: '奥里奥尔·保罗', actors: '马里奥·卡萨斯,安娜·瓦格纳', duration: 106, date: '2017-01-06', lang: '西班牙语', version: '2D', rating: 8.8, desc: '一桩车祸命案的多重反转，悬念迭起的烧脑推理。', types: ['悬疑', '犯罪', '惊悚'], status: 2, hot: 0 },
  { title: '控方证人', director: '比利·怀尔德', actors: '泰隆·鲍华,玛琳·黛德丽', duration: 116, date: '1957-12-17', lang: '英语', version: '2D', rating: 9.6, desc: '法庭上的层层反转，比利·怀尔德悬疑法庭片的巅峰。', types: ['悬疑', '犯罪'], status: 1, hot: 0 },
  { title: '十二怒汉', director: '西德尼·吕美特', actors: '亨利·方达', duration: 96, date: '1957-04-10', lang: '英语', version: '2D', rating: 9.4, desc: '陪审团里十二人的辩论，一人之力撼动偏见的经典。', types: ['悬疑', '剧情'], status: 1, hot: 0 },
  { title: '后窗', director: '阿尔弗雷德·希区柯克', actors: '詹姆斯·斯图尔特,格蕾丝·凯利', duration: 112, date: '1954-09-01', lang: '英语', version: '2D', rating: 8.7, desc: '摄影记者透过窗口窥见命案，紧张窒息的心理悬疑。', types: ['悬疑', '惊悚'], status: 2, hot: 0 },
  { title: '沉默的羔羊', director: '乔纳森·戴米', actors: '朱迪·福斯特,安东尼·霍普金斯', duration: 118, date: '1991-02-14', lang: '英语', version: '2D', rating: 8.9, desc: 'FBI探员求助食人魔医生，追捕连环杀手的惊心博弈。', types: ['惊悚', '犯罪', '悬疑'], status: 2, hot: 0 },
  { title: '穆赫兰道', director: '大卫·林奇', actors: '娜奥米·沃茨', duration: 147, date: '2001-10-12', lang: '英语', version: '2D', rating: 8.4, desc: '好莱坞失忆女子与女演员的迷离之旅，梦境般的惊悚。', types: ['悬疑', '惊悚'], status: 2, hot: 0 },
  { title: '七宗罪', director: '大卫·芬奇', actors: '布拉德·皮特,摩根·弗里曼', duration: 127, date: '1995-09-22', lang: '英语', version: '2D', rating: 8.8, desc: '连环杀手以七宗罪之名行凶，警探步入末日迷局。', types: ['犯罪', '悬疑', '惊悚'], status: 1, hot: 0 },
  { title: '低俗小说', director: '昆汀·塔伦蒂诺', actors: '约翰·特拉沃尔塔,乌玛·瑟曼', duration: 154, date: '1994-10-14', lang: '英语', version: '2D', rating: 8.9, desc: '多线交错的黑色犯罪喜剧，昆汀的叙事革命。', types: ['犯罪', '剧情'], status: 2, hot: 0 },
  { title: '美国往事', director: '赛尔乔·莱昂内', actors: '罗伯特·德尼罗,詹姆斯·伍兹', duration: 229, date: '1984-02-17', lang: '英语', version: '2D', rating: 9.2, desc: '纽约黑帮兄弟数十年的恩怨情仇，史诗般的往事追忆。', types: ['犯罪', '剧情'], status: 2, hot: 0 },
  { title: '教父2', director: '弗朗西斯·科波拉', actors: '阿尔·帕西诺,罗伯特·德尼罗', duration: 202, date: '1974-12-20', lang: '英语', version: '2D', rating: 9.2, desc: '迈克尔的崛起与父亲维托的发迹双线交织，史诗续篇。', types: ['犯罪', '剧情'], status: 2, hot: 0 },
  { title: '拯救大兵瑞恩', director: '史蒂文·斯皮尔伯格', actors: '汤姆·汉克斯,马特·达蒙', duration: 169, date: '1998-07-24', lang: '英语', version: '2D', rating: 9.0, desc: '诺曼底登陆的血火惨烈，八人小队舍命寻回一名士兵。', types: ['战争', '剧情'], status: 2, hot: 0 },
  { title: '地道战', director: '任旭东', actors: '朱龙广,王炳彧', duration: 96, date: '1965-12-01', lang: '国语', version: '2D', rating: 7.8, desc: '抗日军民利用地道灵活机动打击敌人，家喻户晓的经典。', types: ['战争', '历史'], status: 2, hot: 0 },
  { title: '地雷战', director: '唐英奇', actors: '白大钧,张长瑞', duration: 105, date: '1963-01-01', lang: '国语', version: '2D', rating: 7.9, desc: '民兵巧布地雷抗击日寇，人民战争的智慧赞歌。', types: ['战争'], status: 2, hot: 0 },
  { title: '兵临城下', director: '让-雅克·阿诺', actors: '裘德·洛,艾德·哈里斯', duration: 131, date: '2001-03-16', lang: '英语', version: '2D', rating: 8.5, desc: '斯大林格勒战场上苏德王牌狙击手的巅峰对决。', types: ['战争', '剧情'], status: 2, hot: 0 },
  { title: '全金属外壳', director: '斯坦利·库布里克', actors: '马修·莫迪恩', duration: 116, date: '1987-06-26', lang: '英语', version: '2D', rating: 8.5, desc: '越战新兵从训练营到战场的人性异化，战争残酷写照。', types: ['战争'], status: 2, hot: 0 },
  { title: '末代皇帝', director: '贝尔纳多·贝托鲁奇', actors: '尊龙,陈冲', duration: 163, date: '1987-10-23', lang: '英语', version: '2D', rating: 9.3, desc: '中国最后一位皇帝溥仪跌宕一生，历史洪流中的个人命运。', types: ['历史', '剧情', '传记'], status: 1, hot: 0 },
  { title: '我的1919', director: '黄建中', actors: '陈道明,许晴', duration: 98, date: '1999-09-16', lang: '国语', version: '2D', rating: 8.6, desc: '巴黎和会上外交官顾维钧为民族尊严据理力争。', types: ['历史', '剧情'], status: 2, hot: 0 },
  { title: '建国大业', director: '韩三平,黄建新', actors: '唐国强,张国立', duration: 135, date: '2009-09-16', lang: '国语', version: '2D', rating: 8.0, desc: '从重庆谈判到开国大典，新中国诞生的宏大历史画卷。', types: ['历史', '剧情'], status: 2, hot: 0 },
  { title: '建党伟业', director: '韩三平,黄建新', actors: '刘烨,冯远征', duration: 124, date: '2011-06-15', lang: '国语', version: '2D', rating: 6.9, desc: '从辛亥革命到中共一大的风雨历程，重温建党初心。', types: ['历史', '剧情'], status: 2, hot: 0 },
  { title: '鸦片战争', director: '谢晋', actors: '鲍国安,林连昆', duration: 154, date: '1997-06-09', lang: '国语', version: '2D', rating: 7.8, desc: '虎门销烟与鸦片战争的历史悲歌，民族觉醒的序幕。', types: ['历史', '战争'], status: 2, hot: 0 },
  { title: '哈利·波特与魔法石', director: '克里斯·哥伦布', actors: '丹尼尔·雷德克里夫,艾玛·沃森', duration: 152, date: '2001-11-16', lang: '英语', version: '3D', rating: 9.1, desc: '孤儿哈利踏入霍格沃茨，魔法世界的史诗由此开启。', types: ['奇幻', '冒险'], status: 1, hot: 0 },
  { title: '指环王1：护戒使者', director: '彼得·杰克逊', actors: '伊利亚·伍德,伊恩·麦克莱恩', duration: 178, date: '2001-12-19', lang: '英语', version: '3D', rating: 9.2, desc: '九人护戒队踏上销毁魔戒的征途，中土世界的恢弘开篇。', types: ['奇幻', '冒险', '动作'], status: 1, hot: 1 },
  { title: '剪刀手爱德华', director: '蒂姆·波顿', actors: '约翰尼·德普,薇诺娜·瑞德', duration: 105, date: '1990-12-07', lang: '英语', version: '2D', rating: 8.7, desc: '剪刀手人造人不被理解的孤独之爱，哥特童话的温柔悲情。', types: ['奇幻', '爱情'], status: 2, hot: 0 },
  { title: '大鱼', director: '蒂姆·波顿', actors: '伊万·麦克格雷格', duration: 125, date: '2003-12-10', lang: '英语', version: '2D', rating: 8.8, desc: '儿子重读父亲传奇一生，现实与幻想交织的父子情。', types: ['奇幻', '剧情'], status: 2, hot: 0 },
  { title: '夺宝奇兵', director: '史蒂文·斯皮尔伯格', actors: '哈里森·福特', duration: 115, date: '1981-06-12', lang: '英语', version: '2D', rating: 8.5, desc: '考古学家印第安纳·琼斯冒险夺宝，动作冒险片开山之作。', types: ['冒险', '动作'], status: 2, hot: 0 },
  { title: '少年派的奇幻漂流', director: '李安', actors: '苏拉·沙玛,伊尔凡·可汗', duration: 127, date: '2012-11-22', lang: '英语', version: '3D', rating: 9.1, desc: '少年与猛虎在海上漂流的奇幻旅程，关于信仰与生存。', types: ['冒险', '剧情', '奇幻'], status: 2, hot: 0 },
  { title: '加勒比海盗1', director: '戈尔·维宾斯基', actors: '约翰尼·德普,奥兰多·布鲁姆', duration: 143, date: '2003-07-09', lang: '英语', version: '2D', rating: 8.8, desc: '杰克船长的海盗冒险启程，浪漫而狂放的海上传奇。', types: ['冒险', '喜剧'], status: 2, hot: 0 },
  { title: '侏罗纪公园', director: '史蒂文·斯皮尔伯格', actors: '山姆·尼尔,劳拉·邓恩', duration: 127, date: '1993-06-11', lang: '英语', version: '3D', rating: 8.2, desc: '克隆恐龙失控出逃，一座主题公园沦为夺命绝境。', types: ['冒险', '科幻'], status: 2, hot: 0 },
  { title: '美丽心灵', director: '朗·霍华德', actors: '罗素·克劳,詹妮弗·康纳利', duration: 135, date: '2001-12-21', lang: '英语', version: '2D', rating: 9.0, desc: '数学家纳什与精神分裂症抗争，爱与天才的传奇人生。', types: ['传记', '剧情'], status: 2, hot: 0 },
  { title: '国王的演讲', director: '汤姆·霍伯', actors: '科林·费尔斯,杰弗里·拉什', duration: 118, date: '2010-09-06', lang: '英语', version: '2D', rating: 8.5, desc: '口吃国王在语言治疗师帮助下克服障碍，发表战时演说。', types: ['传记', '剧情'], status: 2, hot: 0 },
  { title: '当幸福来敲门', director: '加布里尔·穆奇诺', actors: '威尔·史密斯', duration: 117, date: '2006-12-15', lang: '英语', version: '2D', rating: 9.1, desc: '落魄推销员带着儿子咬牙追梦，终迎幸福来敲门。', types: ['传记', '剧情', '家庭'], status: 1, hot: 0 },
  { title: '血战钢锯岭', director: '梅尔·吉布森', actors: '安德鲁·加菲尔德', duration: 139, date: '2016-11-04', lang: '英语', version: '2D', rating: 8.8, desc: '拒绝持枪的军医在战场上徒手救下数十名战友的奇迹。', types: ['传记', '战争', '剧情'], status: 2, hot: 0 },
  { title: '岁月神偷', director: '罗启锐', actors: '任达华,吴君如', duration: 117, date: '2010-03-11', lang: '国语', version: '2D', rating: 8.7, desc: '香港深水埗平凡家庭的艰辛岁月，偷不走的人间真情。', types: ['家庭', '剧情'], status: 2, hot: 0 },
  { title: '海蒂和爷爷', director: '阿兰·格斯波纳', actors: '阿努克·斯特芬,布鲁诺·甘茨', duration: 111, date: '2015-12-10', lang: '德语', version: '2D', rating: 9.2, desc: '孤儿海蒂在阿尔卑斯山治愈孤独爷爷，纯真温暖人心。', types: ['家庭', '剧情'], status: 2, hot: 0 },
  { title: '小男孩', director: '亚历杭德罗·蒙特沃德', actors: '雅各布·萨尔瓦蒂', duration: 106, date: '2015-04-24', lang: '英语', version: '2D', rating: 8.3, desc: '小男孩以纯真信念等待父亲从战场归来，感人至深。', types: ['家庭', '剧情', '战争'], status: 2, hot: 0 },
  { title: '巴黎淘气帮', director: '洛朗·迪拉尔', actors: '马克西姆·戈达尔', duration: 92, date: '2009-11-18', lang: '法语', version: '2D', rating: 8.9, desc: '一群小鬼的爆笑成长与友谊，童真无敌的法式喜剧。', types: ['家庭', '喜剧'], status: 2, hot: 0 },
  { title: '闪灵', director: '斯坦利·库布里克', actors: '杰克·尼科尔森', duration: 146, date: '1980-05-23', lang: '英语', version: '2D', rating: 8.3, desc: '与世隔绝的酒店里，作家杰克逐渐陷入疯狂与恐怖。', types: ['惊悚'], status: 2, hot: 0 },
  { title: '禁闭岛', director: '马丁·斯科塞斯', actors: '莱昂纳多·迪卡普里奥', duration: 138, date: '2010-02-19', lang: '英语', version: '2D', rating: 8.8, desc: '联邦警探调查孤岛精神病院离奇失踪案，真相扑朔迷离。', types: ['惊悚', '悬疑'], status: 2, hot: 0 },
  { title: '记忆碎片', director: '克里斯托弗·诺兰', actors: '盖·皮尔斯', duration: 113, date: '2000-10-11', lang: '英语', version: '2D', rating: 8.6, desc: '失忆男子以碎片化记忆追查杀妻真凶，倒叙悬疑杰作。', types: ['悬疑', '惊悚', '犯罪'], status: 2, hot: 0 },
  { title: '电锯惊魂', director: '温子仁', actors: '加利·艾尔维斯', duration: 103, date: '2004-10-29', lang: '英语', version: '2D', rating: 8.7, desc: '密室中的致命游戏考验人性，低成本恐怖的经典开端。', types: ['惊悚', '犯罪'], status: 2, hot: 0 },
  { title: '音乐之声', director: '罗伯特·怀斯', actors: '朱莉·安德鲁斯,克里斯托弗·普卢默', duration: 174, date: '1965-03-02', lang: '英语', version: '2D', rating: 9.1, desc: '修女玛利亚以歌声温暖冯·特拉普上校一家，温暖人心。', types: ['剧情', '家庭'], status: 2, hot: 0 },
  { title: '放牛班的春天', director: '克里斯托夫·巴拉蒂', actors: '热拉尔·朱尼奥', duration: 97, date: '2004-10-16', lang: '法语', version: '2D', rating: 9.3, desc: '音乐老师用合唱唤醒"问题少年"心中的春天与希望。', types: ['剧情'], status: 1, hot: 0 },
  { title: '流浪地球', director: '郭帆', actors: '吴京,屈楚萧', duration: 125, date: '2019-02-05', lang: '国语', version: '3D', rating: 7.9, desc: '太阳将熄，人类带地球流浪星际的中国科幻里程碑。', types: ['科幻', '冒险', '剧情'], status: 1, hot: 0 },
  { title: '长津湖', director: '陈凯歌,徐克,林超贤', actors: '吴京,易烊千玺', duration: 176, date: '2021-09-30', lang: '国语', version: '3D', rating: 7.4, desc: '抗美援朝长津湖战役中志愿军钢铁意志的壮烈史诗。', types: ['战争', '历史', '剧情'], status: 1, hot: 0 },
  { title: '红海行动', director: '林超贤', actors: '张译,黄景瑜', duration: 138, date: '2018-02-16', lang: '国语', version: '3D', rating: 8.3, desc: '蛟龙突击队深入异国撤侨营救，热血激昂的军事动作片。', types: ['战争', '动作'], status: 1, hot: 0 },
  { title: '湄公河行动', director: '林超贤', actors: '张涵予,彭于晏', duration: 124, date: '2016-09-30', lang: '国语', version: '2D', rating: 8.0, desc: '缉毒警跨国追凶，捍卫湄公河正义的硬核动作纪实。', types: ['动作', '犯罪'], status: 2, hot: 0 }
];

function boxFor(m) {
  if (m.status === 2) return '0.00';
  const base = m.hot ? 15000 : 6000;
  const unit = m.hot ? 4000 : 1200;
  return (base + m.rating * unit).toFixed(2);
}

async function main() {
  const conn = await mysql.createConnection(DB);
  // 收集生成的 SQL 文本，最终写入 seed_movies.sql
  const L = [];
  const push = (sql) => L.push(sql);

  try {
    console.log('连接数据库成功，开始重建影片数据...');

    // 静态文件头部 + 清表（与下方执行保持一致）
    push('-- ============================================================');
    push('-- 星辉影城在线购票系统 - 真实影片数据（102 部经典影片，仅元数据）');
    push('-- 由 node database/seed_movies.js 自动生成；在 init.sql 之后单独导入');
    push('-- ============================================================');
    push('SET NAMES utf8mb4;');
    push('SET FOREIGN_KEY_CHECKS = 0;');
    push('');
    const tables = ['favorite', 'order_item', 'orders', 'movie_category', 'banner', 'showtime', 'movie', 'category'];
    for (const t of tables) push(`TRUNCATE TABLE \`${t}\`;`);
    push('');

    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const t of tables) await conn.query(`TRUNCATE TABLE \`${t}\``);

    // 1. 插入类型
    const catIdMap = {};
    for (let i = 0; i < CATEGORIES.length; i++) {
      const sql = format('INSERT INTO category(name, sort) VALUES (?, ?)', [CATEGORIES[i], i + 1]);
      push(sql + ';');
      const [r] = await conn.query(sql);
      catIdMap[CATEGORIES[i]] = r.insertId;
    }
    push('');

    // 2. 插入影片
    const movieIds = [];
    for (const m of MOVIES) {
      const sql = format(
        'INSERT INTO movie(title, director, actors, duration, release_date, language, version, rating, description, poster_url, status, is_hot, box_office) VALUES (?,?,?,?,?,?,?,?,?,NULL,?,?,?)',
        [m.title, m.director, m.actors, m.duration, m.date, m.lang, m.version, m.rating, m.desc, m.status, m.hot, boxFor(m)]
      );
      push(sql + ';');
      const [r] = await conn.query(sql);
      movieIds.push(r.insertId);
    }
    push('');

    // 3. 插入影片-类型关联
    for (let i = 0; i < MOVIES.length; i++) {
      const mid = movieIds[i];
      for (const t of MOVIES[i].types) {
        const sql = format('INSERT INTO movie_category(movie_id, category_id) VALUES (?, ?)', [mid, catIdMap[t]]);
        push(sql + ';');
        await conn.query(sql);
      }
    }
    push('');

    // 4. 轮播图（取 3 部热门影片）
    const hotMovies = MOVIES.map((m, i) => ({ ...m, id: movieIds[i] })).filter(m => m.hot && m.status === 1).slice(0, 3);
    for (let i = 0; i < hotMovies.length; i++) {
      const m = hotMovies[i];
      const sql = format('INSERT INTO banner(title, image_url, link_type, link_id, sort) VALUES (?,?,?,?,?)',
        [`${m.title} 热映中`, `/static/banner/${i + 1}.jpg`, 'movie', m.id, i + 1]);
      push(sql + ';');
      await conn.query(sql);
    }
    push('');

    // 5. 场次：7 个影厅 × 7 天 × 7 个时段 = 343 个组合，取前 300 场
    //    冲突控制：组合按「日期 → 时段 → 影厅」排列，同一影厅同一天同一时段只排一部影片；
    //    影片按轮询分配，同一「日期+时段」内各影厅的影片互不相同（影厅数 7 < 热映影片数）
    const [hallRows] = await conn.query('SELECT id, cinema_id, total_seat FROM hall ORDER BY id');
    if (!hallRows.length) throw new Error('影厅数据为空，请先导入 init.sql');
    const slots = ['10:00:00', '12:00:00', '14:00:00', '16:00:00', '18:00:00', '20:00:00', '22:00:00'];
    const onShow = MOVIES.map((m, i) => ({ ...m, id: movieIds[i] })).filter(m => m.status === 1);
    const TARGET = 300;
    const combos = [];
    for (let d = 0; d < 7; d++) {
      for (const slot of slots) {
        for (const h of hallRows) combos.push({ d, slot, hall: h });
      }
    }
    let showtimeCount = 0;
    for (let i = 0; i < combos.length && showtimeCount < TARGET; i++) {
      const { d, slot, hall } = combos[i];
      const m = onShow[i % onShow.length];
      const is3d = m.version === '3D';
      const price = is3d ? 58 + (i % 3) : 38 + (i % 3) * 3;
      const origin = price + 15;
      const sql = format(
        'INSERT INTO showtime(movie_id, cinema_id, hall_id, show_date, show_time, version, price, origin_price, total_seat, sold_seat, status) VALUES (?,?,?,DATE_ADD(CURDATE(), INTERVAL ? DAY),?,?,?,?,?,0,1)',
        [m.id, hall.cinema_id, hall.id, d, slot, m.version, price, origin, hall.total_seat]
      );
      push(sql + ';');
      await conn.query(sql);
      showtimeCount++;
    }
    push('');
    push('SET FOREIGN_KEY_CHECKS = 1;');

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    // 写出静态 SQL 文件（与 init.sql 同目录）
    const outPath = path.join(__dirname, 'seed_movies.sql');
    fs.writeFileSync(outPath, L.join('\n') + '\n', 'utf8');

    console.log(`✅ 完成：分类 ${CATEGORIES.length} 个，影片 ${MOVIES.length} 部，类型关联 ${MOVIES.reduce((s, m) => s + m.types.length, 0)} 条，轮播图 ${hotMovies.length} 张，场次 ${showtimeCount} 场`);
    console.log(`   热映 ${onShow.length} 部（可购票），即将上映 ${MOVIES.length - onShow.length} 部`);
    console.log(`   已生成静态文件：${outPath}`);
  } catch (e) {
    console.error('导入失败:', e.message);
    throw e;
  } finally {
    await conn.end();
  }
}

main().then(() => process.exit(0)).catch(() => process.exit(1));