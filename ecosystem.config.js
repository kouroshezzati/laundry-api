module.exports = {
  apps : [{
    name: 'Laundry-api',
    script: 'server/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      DEBUG: ''
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }],

  deploy : {
    production : {
      user : 'mosl3m',
      host : 'localhost',
      ref  : 'origin/master',
      repo : 'mosl3m@145.131.3.166:/home/mosl3m/laundry-api.git',
      path : '/var/www/laundry-api',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
