const { ZebrunnerConfigurator } = require('..');

module.exports = {
  src_folders: ['specs'],
  page_objects_path: [],
  custom_commands_path: ['tests/commands'],
  custom_assertions_path: [],
  plugins: [],
  globals_path: 'globals.js',

  webdriver: {},

  test_workers: {
    enabled: true,
    workers: 'auto',
  },

  live_output: true,
  parallel_process_delay: 3000,

  reporterOptions: {
    zebrunnerConfig: {
      enabled: true,
      projectKey: 'ANNAS',
      server: {
        hostname: 'https://solvdinternal.zebrunner.com/',
        accessToken: 'CAve1wEDfcbfWuhMdtoPHAaDdaMCOyaUUR7ykFRvi7YwipX6Ee',
      },
      launch: {
        displayName: 'Nightwatch run',
        build: 'alpha-1',
        environment: 'Local',
        locale: 'en_US',
        treatSkipsAsFailures: true,
        labels: {
          runner: 'Alice',
          reviewer: 'Bob',
        },
        artifactReferences: {
          landing: 'https://zebrunner.com',
        },
      },
      milestone: {
        id: 1,
        name: 'Release 1.0.0',
      },
      notifications: {
        notifyOnEachFailure: false,
        slackChannels: 'dev, qa',
        teamsChannels: 'dev-channel, management',
        // emails: 'asukhodolova@solvd.com',
      },
      tcm: {
        testCaseStatus: {
          onPass: '',
          onFail: '',
        },
        zebrunner: {
          pushResults: false,
          pushInRealTime: true,
          testRunId: 17,
        },
        testRail: {
          pushResults: false,
          pushInRealTime: true,
          suiteId: 174,
          runId: 642,
          includeAllTestCasesInNewRun: true,
          runName: 'New Nightwatch Run',
          milestoneName: 'Nightwatch milestone',
          assignee: 'developer@zebrunner.com',
        },
        xray: {
          pushResults: false,
          pushInRealTime: true,
          executionKey: 'QT-1',
        },
        zephyr: {
          pushResults: false,
          pushInRealTime: true,
          jiraProjectKey: 'QT',
          testCycleKey: 'QT-R5',
        },
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

    zebrunner: ZebrunnerConfigurator.configureLauncher({
      selenium: {
        host: 'engine.zebrunner.com',
        port: 443,
      },
      username: '<username>',
      access_key: '<access_key>',

      webdriver: {
        start_process: false,
      },
      desiredCapabilities: {
        platformName: 'linux',
        browserName: 'chrome',
        browserVersion: '105.0',
        'zebrunner:provider': 'ZEBRUNNER',
      },
    }),
  },
};
