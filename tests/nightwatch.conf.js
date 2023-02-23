module.exports = {
  src_folders: ['specs'],
  page_objects_path: [],
  custom_commands_path: [],
  custom_assertions_path: [],
  plugins: [],
  globals_path: 'globals.js',

  webdriver: {},

  test_workers: {
    enabled: true,
    workers: 'auto',
  },

  parallel_process_delay: 3000,

  reporterOptions: {
    zebrunnerConfig: {
      enabled: true,
      projectKey: 'ANNAS',
      server: {
        hostname: 'https://solvdinternal.zebrunner.com/',
        accessToken: 'CAve1wEDfcbfWuhMdtoPHAaDdaMCOyaUUR7ykFRvi7YwipX6Ee',
      },
      run: {
        displayName: 'Nightwatch run',
        build: 'alpha-1',
        environment: 'Local',
      },
      milestone: {
        id: 1,
        name: 'Release 1.0.0',
      },
      notifications: {
        notifyOnEachFailure: false,
        slackChannels: 'dev, qa',
        teamsChannels: 'dev-channel, management',
        emails: 'asukhodolova@solvd.com',
      },
    },
  },

  test_settings: {
    default: {
      disable_error_log: false,
      launch_url: 'http://localhost',

      screenshots: {
        enabled: true,
        path: 'screens',
        on_failure: true,
        on_error: true,
      },

      desiredCapabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          w3c: true,
          args: ['start-maximized'],
        },
      },

      webdriver: {
        start_process: true,
        server_path: '',
      },
    },

    remote: {
      selenium: {
        start_process: false,
        server_path: '',
        host: 'engine.zebrunner.com',
        port: 443,
      },

      username: 'username',
      access_key: 'access_key',

      webdriver: {
        keep_alive: true,
        start_process: false,
      },
    },

    'remote.chrome': {
      extends: 'remote',
      desiredCapabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          w3c: true,
        },
        'zebrunner:provider': 'ZEBRUNNER',
      },
    },

    mocha_tests: {
      test_runner: {
        type: 'mocha',
        options: {
          ui: 'bdd',
          reporter: '../index.js',
          reporterOptions: {
            zebrunnerConfig: {
              enabled: true,
              projectKey: 'ANNAS',
              server: {
                hostname: 'https://solvdinternal.zebrunner.com/',
                accessToken: 'CAve1wEDfcbfWuhMdtoPHAaDdaMCOyaUUR7ykFRvi7YwipX6Ee',
              },
              run: {
                displayName: 'Nightwatch run',
                build: 'alpha-1',
                environment: 'Local',
              },
            },
          },
        },
      },
    },
  },
};
