const fs = require('fs');
const path = require('path');

const isPortablePackage = () => {
  if (process.pkg) return true;
  return process.execPath.includes('XingNovel-node');
};

const getRootDir = () => {
  if (isPortablePackage()) {
    return path.dirname(process.execPath);
  }
  return path.join(__dirname, '..', '..');
};

const loadBetterSqlite3 = () => {
  if (process.pkg) {
    const portableModulePath = path.join(
      path.dirname(process.execPath),
      'server',
      'node_modules',
      'better-sqlite3'
    );
    if (fs.existsSync(portableModulePath)) {
      return require(portableModulePath);
    }
    const runtimeModulePath = path.join(
      path.dirname(process.execPath),
      'runtime',
      'node_modules',
      'better-sqlite3'
    );
    if (fs.existsSync(runtimeModulePath)) {
      return require(runtimeModulePath);
    }
    throw new Error(`Packaged runtime dependency not found: better-sqlite3`);
  }

  return require('better-sqlite3');
};
const Database = loadBetterSqlite3();

// 获取数据库路径（兼容 pkg 打包环境和便携式打包环境）
const getDbPath = () => {
  // 如果环境变量指定了 DB_PATH，优先使用
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }
  // 便携式打包环境：使用可执行文件所在目录下的 server/database 子目录
  if (isPortablePackage()) {
    return path.join(getRootDir(), 'server', 'database', 'novel.db');
  }
  // 开发环境使用当前目录
  return path.join(__dirname, 'novel.db');
};

// 创建或打开数据库
const db = new Database(getDbPath(), { verbose: console.log });

// 创建表结构
const initDatabase = () => {
  // 书本表
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      cover TEXT,
      author TEXT,
      category TEXT,
      tags TEXT,
      status TEXT DEFAULT 'draft',
      is_public INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 章节表
  db.exec(`
    CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      summary TEXT DEFAULT '',
      order_num INTEGER DEFAULT 0,
      type TEXT DEFAULT 'chapter',
      volume_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
      FOREIGN KEY (volume_id) REFERENCES volumes(id) ON DELETE SET NULL
    )
  `);

  // 提示词表
  db.exec(`
    CREATE TABLE IF NOT EXISTS prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      category TEXT,
      order_num INTEGER DEFAULT 0,
      fields TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 备忘录表（全局共享）
  db.exec(`
    CREATE TABLE IF NOT EXISTS memos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      category TEXT,
      order_num INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]',
      is_pinned INTEGER DEFAULT 0,
      word_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS experience_shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      summary TEXT,
      content TEXT NOT NULL,
      content_render_mode TEXT DEFAULT 'markdown',
      cover_url TEXT,
      pdf_file_url TEXT,
      pdf_file_name TEXT,
      pdf_file_size INTEGER,
      create_type TEXT DEFAULT 'manual',
      author_id INTEGER,
      author_name TEXT DEFAULT '星芒用户',
      status TEXT DEFAULT 'published',
      pdf_parse_status TEXT,
      pdf_parse_result TEXT,
      source_file_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 分卷表
  db.exec(`
    CREATE TABLE IF NOT EXISTS volumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      order_num INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `);

  // API 服务商表
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      provider_type TEXT NOT NULL,
      api_key TEXT,
      api_url TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // API模型表
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      model TEXT NOT NULL,
      temperature REAL DEFAULT 0.7,
      max_tokens INTEGER DEFAULT 2000,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (provider_id) REFERENCES api_providers(id) ON DELETE CASCADE
    )
  `);

  // 迁移旧的api_configs数据到新表结构
  const migrateOldConfigs = () => {
    try {
      // 检查是否存在旧表
      const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='api_configs'").get();
      
      if (tableExists) {
        // 获取旧配置
        const oldConfigs = db.prepare('SELECT * FROM api_configs').all();
        
        if (oldConfigs.length > 0) {
          console.log(`发现${oldConfigs.length}条旧配置，开始迁移...`);
          
          // 为每个旧配置创建服务商和模型
          const insertProvider = db.prepare('INSERT INTO api_providers (name, provider_type, api_key, api_url) VALUES (?, ?, ?, ?)');
          const insertModel = db.prepare('INSERT INTO api_models (provider_id, name, model, temperature, max_tokens, is_default) VALUES (?, ?, ?, ?, ?, ?)');
          
          for (const config of oldConfigs) {
            // 创建服务商
            const providerResult = insertProvider.run(
              `${config.name}-服务商`,
              config.provider,
              config.api_key,
              config.api_url
            );
            
            // 创建模型
            insertModel.run(
              providerResult.lastInsertRowid,
              config.name,
              config.model,
              config.temperature,
              config.max_tokens,
              config.is_default
            );
          }
          
          console.log('配置迁移完成');
          
          // 重命名旧表作为备份
          db.exec('ALTER TABLE api_configs RENAME TO api_configs_backup');
          console.log('旧配置表已重命名为api_configs_backup');
        }
      }
    } catch (error) {
      console.log('配置迁移过程:', error.message);
    }
  };
  
  migrateOldConfigs();

  // 迁移books表，添加新字段
  const migrateBooksTable = () => {
    try {
      const columns = db.prepare("PRAGMA table_info(books)").all();
      const columnNames = columns.map(col => col.name);
      
      const newColumns = [
        { name: 'author', sql: 'ALTER TABLE books ADD COLUMN author TEXT' },
        { name: 'category', sql: 'ALTER TABLE books ADD COLUMN category TEXT' },
        { name: 'tags', sql: 'ALTER TABLE books ADD COLUMN tags TEXT' },
        { name: 'status', sql: 'ALTER TABLE books ADD COLUMN status TEXT DEFAULT "draft"' },
        { name: 'is_public', sql: 'ALTER TABLE books ADD COLUMN is_public INTEGER DEFAULT 0' }
      ];
      
      for (const col of newColumns) {
        if (!columnNames.includes(col.name)) {
          db.exec(col.sql);
          console.log(`已添加books表字段: ${col.name}`);
        }
      }
    } catch (error) {
      console.log('books表迁移过程:', error.message);
    }
  };
  
  migrateBooksTable();

  const migrateChaptersTable = () => {
    try {
      const columns = db.prepare("PRAGMA table_info(chapters)").all();
      const columnNames = columns.map(col => col.name);

      const newColumns = [
        { name: 'summary', sql: "ALTER TABLE chapters ADD COLUMN summary TEXT DEFAULT ''" },
        { name: 'volume_id', sql: 'ALTER TABLE chapters ADD COLUMN volume_id INTEGER' }
      ];

      for (const col of newColumns) {
        if (!columnNames.includes(col.name)) {
          db.exec(col.sql);
          console.log(`chapters琛ㄦ坊鍔犲瓧娈? ${col.name}`);
        }
      }
    } catch (error) {
      console.log('chapters琛ㄨ縼绉昏繃绋?', error.message);
    }
  };

  migrateChaptersTable();

  // 迁移prompts表，添加fields字段
  const migratePromptsTable = () => {
    try {
      const columns = db.prepare("PRAGMA table_info(prompts)").all();
      const columnNames = columns.map(col => col.name);
      
      if (!columnNames.includes('fields')) {
        db.exec('ALTER TABLE prompts ADD COLUMN fields TEXT');
        console.log('已添加prompts表字段: fields');
      }
      if (!columnNames.includes('subcategories')) {
        db.exec('ALTER TABLE prompts ADD COLUMN subcategories TEXT');
        console.log('已添加prompts表字段: subcategories');
      }
      if (!columnNames.includes('description')) {
        db.exec('ALTER TABLE prompts ADD COLUMN description TEXT');
        console.log('已添加prompts表字段: description');
      }
    } catch (error) {
      console.log('prompts表迁移过程:', error.message);
    }
  };
  
  migratePromptsTable();

  const migrateExperienceSharesTable = () => {
    try {
      const columns = db.prepare("PRAGMA table_info(experience_shares)").all();
      const columnNames = columns.map(col => col.name);

      const newColumns = [
        { name: 'content_render_mode', sql: "ALTER TABLE experience_shares ADD COLUMN content_render_mode TEXT DEFAULT 'markdown'" },
        { name: 'cover_url', sql: 'ALTER TABLE experience_shares ADD COLUMN cover_url TEXT' },
        { name: 'pdf_file_url', sql: 'ALTER TABLE experience_shares ADD COLUMN pdf_file_url TEXT' },
        { name: 'pdf_file_name', sql: 'ALTER TABLE experience_shares ADD COLUMN pdf_file_name TEXT' },
        { name: 'pdf_file_size', sql: 'ALTER TABLE experience_shares ADD COLUMN pdf_file_size INTEGER' },
        { name: 'create_type', sql: "ALTER TABLE experience_shares ADD COLUMN create_type TEXT DEFAULT 'manual'" },
        { name: 'author_id', sql: 'ALTER TABLE experience_shares ADD COLUMN author_id INTEGER' },
        { name: 'author_name', sql: "ALTER TABLE experience_shares ADD COLUMN author_name TEXT DEFAULT '星芒用户'" },
        { name: 'status', sql: "ALTER TABLE experience_shares ADD COLUMN status TEXT DEFAULT 'published'" },
        { name: 'pdf_parse_status', sql: 'ALTER TABLE experience_shares ADD COLUMN pdf_parse_status TEXT' },
        { name: 'pdf_parse_result', sql: 'ALTER TABLE experience_shares ADD COLUMN pdf_parse_result TEXT' },
        { name: 'source_file_name', sql: 'ALTER TABLE experience_shares ADD COLUMN source_file_name TEXT' }
      ];

      for (const col of newColumns) {
        if (!columnNames.includes(col.name)) {
          db.exec(col.sql);
          console.log(`宸叉坊鍔爀xperience_shares琛ㄥ瓧娈? ${col.name}`);
        }
      }
    } catch (error) {
      console.log('experience_shares琛ㄨ縼绉昏繃绋?', error.message);
    }
  };

  migrateExperienceSharesTable();

  // 迁移 memos 表，添加新字段
  const migrateMemosTable = () => {
    try {
      const columns = db.prepare("PRAGMA table_info(memos)").all();
      const columnNames = columns.map(col => col.name);
      
      const newColumns = [
        { name: 'tags', sql: "ALTER TABLE memos ADD COLUMN tags TEXT DEFAULT '[]'" },
        { name: 'is_pinned', sql: 'ALTER TABLE memos ADD COLUMN is_pinned INTEGER DEFAULT 0' },
        { name: 'word_count', sql: 'ALTER TABLE memos ADD COLUMN word_count INTEGER DEFAULT 0' }
      ];
      
      for (const col of newColumns) {
        if (!columnNames.includes(col.name)) {
          db.exec(col.sql);
          console.log(`已添加 memos 表字段：${col.name}`);
        }
      }
    } catch (error) {
      console.log('memos 表迁移过程:', error.message);
    }
  };
  
  migrateMemosTable();

  // 对话表（会话）
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      title TEXT DEFAULT '新对话',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `);

  // 对话消息表
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversation_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    )
  `);

  // 生成器表
  db.exec(`
    CREATE TABLE IF NOT EXISTS generators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT DEFAULT 'Lightning',
      core_prompt TEXT,
      remark TEXT,
      order_num INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 角色表
  db.exec(`
    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      name TEXT NOT NULL DEFAULT '未命名角色',
      gender TEXT DEFAULT 'unknown',
      personality TEXT,
      info TEXT,
      folder TEXT DEFAULT '全部',
      folders TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `);

  // 使用统计表
  db.exec(`
    CREATE TABLE IF NOT EXISTS usage_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      model_id INTEGER,
      model_name TEXT NOT NULL,
      provider_name TEXT,
      usage_count INTEGER DEFAULT 1,
      total_tokens INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (model_id) REFERENCES api_models(id) ON DELETE SET NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      scene TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_node_library (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      variant TEXT,
      category TEXT NOT NULL,
      label TEXT NOT NULL,
      description TEXT,
      outputs TEXT,
      generated INTEGER DEFAULT 0,
      template TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_usage_stats_date ON usage_stats(date)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_usage_stats_model ON usage_stats(model_id)
  `);

  console.log('数据库初始化完成');
};

// 初始化数据库
initDatabase();

module.exports = db;
