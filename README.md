# Zebrunner Nightwatch reporting agent

The Nightwatch Agent supports and works with default Nightwatch and [Mocha](https://nightwatchjs.org/guide/writing-tests/using-mocha.html) runners so far.

Please refer to the appropriate section below to find more information about configuration.
- [Nightwatch runner](#reporter-setup---nightwatch-runner)
- [Mocha runner](#reporter-setup---mocha-runner)


## Inclusion into your project

### Adding dependency

First, you need to add the Zebrunner Agent into your `package.json` file by executing the following command:

```shell
npm install @zebrunner/javascript-agent-nightwatch
```

### Reporter setup - Nightwatch runner

The agent does not work automatically after adding it into the project, it requires extra configuration. For this, you need to perform the following steps:

1. Create a file with global hooks (in this example they are located in `lib/globals.js`) or open existing one if you already have it and configure Zebrunner reporting. 
Read more about [Nightwatch global hooks](https://nightwatchjs.org/guide/writing-tests/global-test-hooks.html).
- import `ZebrunnerReporter`, `ZebrunnerReporterAPI` from `@zebrunner/javascript-agent-nightwatch` package and configuration file of your project (`nightwatch.conf.js` by default).
- add `before`, `after`, `beforeEach` and `afterEach` hooks handlers (or update if already have it) to start and finish Zebrunner runs.

#### **`globals.js`**
   ```js
    const { ZebrunnerReporter, ZebrunnerReporterAPI } = require('@zebrunner/javascript-agent-nightwatch/lib/nightwatch/realTimeReporter');
    const config = require('../nightwatch.conf')
    let zbrReporter;

    module.exports = {
        before: async () => {
            zbrReporter = new ZebrunnerReporter(config);
            await zbrReporter.startTestRun();
        },

        after: async () => {
            await zbrReporter.finishTestRun();
        },

        beforeEach: (browser, done) => {
            ZebrunnerReporterAPI.startTestSession(browser);
            done();
        },

        afterEach: (browser, done) => {
            ZebrunnerReporterAPI.finishTestSession(browser);
            done();
        },
    };
   ```
2. Navigate to your Nightwatch configuration file (by default, it is `nightwatch.conf.js`) and provide following information:
- the path with globals hooks for `globals_path` variable (in our case `lib/globals.js`);
- Zebrunner reporter configuration. You can find more information in the next section [Reporter configuration](#reporter-configuration);

#### **`nightwatch.conf.js`**
   ```js
   module.exports = {
        // ...
        src_folders: ["tests"],

        // path to file with Global hooks
        globals_path: "lib/globals.js", 
        // Zebrunner reporter configuration
        reporterOptions: {
            zebrunnerConfig: {
                enabled: true,
                projectKey: 'DEF',
                server: {
                    hostname: 'https://mycompany.zebrunner.com',
                    accessToken: 'somesecretaccesstoken'
                },
                run: {
                    displayName: "Nightly Regression",
                    build: '2.41.2.2431-SNAPSHOT',
                    environment: 'QA',
                },
            }
        }
        // ...
   };
   ```
3. Update your *ALL* existing test files with `beforeEach` and `afterEach` hooks handlers to start and finish Zebrunner tests:

- Bdd syntax
   ```js
    const { ZebrunnerReporterAPI } = require("@zebrunner/javascript-agent-nightwatch/lib/nightwatch/realTimeReporter");

    describe("Test Suite", function () {

        beforeEach((browser) => {
            ZebrunnerReporterAPI.startTest(browser);
        });

        afterEach((browser) => {
            ZebrunnerReporterAPI.finishTest(browser);
        });
    });
   ```
- Exports syntax
   ```js
    const { ZebrunnerReporterAPI } = require("@zebrunner/javascript-agent-nightwatch/lib/nightwatch/realTimeReporter");

    module.exports = {

        beforeEach: function (browser) {
            ZebrunnerReporterAPI.startTest(browser);
        },

        afterEach: function (browser) {
            ZebrunnerReporterAPI.finishTest(browser);
        },
    }
   ```

### Reporter setup - Mocha runner

The agent does not work automatically after adding it into the project, it requires extra configuration. For this, you need to perform the following steps:

1. Navigate to your Nightwatch configuration file (by default, it is `nightwatch.conf.js`)
2. Since the agent works with Mocha as test runner in Nightwatch, it is necessary to set the `test_runner` config property and set the type to `mocha`. Make sure that `ui` option reflects correct style used by your tests (`bdd`, `tdd` etc.). 
3. Add `@zebrunner/javascript-agent-nightwatch` as a reporter inside custom Mocha options and provide the reporter configuration (you can find more about that in the next section). Here is an example of a configuration snippet:

#### **`nightwatch.conf.js`**
   ```js
   module.exports = {
        // ...
        test_settings: {
            default: {
                test_runner: {
                    type: 'mocha',
                    options: {
                        ui: 'bdd',
                        reporter: "@zebrunner/javascript-agent-nightwatch",
                        reporterOptions: {
                            zebrunnerConfig: {
                            // Zebrunner reporter configuration
                            },
                        },
                    },
                },
                // other configs
            },
        },
        // ...
   };
   ```

## Reporter configuration

Once the agent is added into your project, it is **not** automatically enabled. The valid configuration must be provided first.

It is currently possible to provide the configuration via:

1. Environment variables
2. `nightwatch.conf.js` file

The configuration lookup will be performed in the order listed above, meaning that environment configuration will always take precedence over `nightwatch.conf.js` file. As a result, it is possible to override configuration parameters by passing them through a configuration mechanism with higher precedence.

### Configuration options

The following subsections contain tables with configuration options. The first column in these tables contains the name of the option. It is represented as an environment variable (the first value) and as a reporter config property from `nightwatch.conf.js` file (the second value). The second column contains description of the configuration option.

#### Common configuration

| Env var / Reporter config                                | Description                                                                                                                                                                         |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `REPORTING_ENABLED`<br/>`enabled`                        | Enables or disables reporting. The default value is `false`.                                                                                                                        |
| `REPORTING_PROJECT_KEY`<br/>`projectKey`                 | Optional value. It is the key of Zebrunner project that the launch belongs to. The default value is `DEF`.                                                                          |
| `REPORTING_SERVER_HOSTNAME`<br/>`server.hostname`        | Mandatory if reporting is enabled. It is your Zebrunner hostname, e.g. `https://mycompany.zebrunner.com`.                                                                           |
| `REPORTING_SERVER_ACCESS_TOKEN`<br/>`server.accessToken` | Mandatory if reporting is enabled. The access token is used to perform API calls. It can be obtained in Zebrunner on the 'Account and profile' page under the 'API Tokens' section. |

#### Automation launch configuration

The following configuration options allow you to configure accompanying information that will be displayed in Zebrunner for the automation launch.

| Env var / Reporter config                          | Description                                                                                                                             |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `REPORTING_RUN_DISPLAY_NAME`<br/>`run.displayName` | Display name of the launch in Zebrunner. The default value is `Default Suite`.                                                          |
| `REPORTING_RUN_BUILD`<br/>`run.build`              | Build number associated with the launch. It can reflect either the test build number or the build number of the application under test. |
| `REPORTING_RUN_ENVIRONMENT`<br/>`run.environment`  | Represents the target environment in which the tests were run. For example, `stage` or `prod`.                                          |

### Examples

=== "Environment Variables"

The following code snippet is a list of all configuration environment variables from `.env` file:

   ```text
    REPORTING_ENABLED=true
    REPORTING_PROJECT_KEY=DEF
    REPORTING_SERVER_HOSTNAME=https://mycompany.zebrunner.com
    REPORTING_SERVER_ACCESS_TOKEN=somesecretaccesstoken

    REPORTING_RUN_DISPLAY_NAME=Nightly Regression
    REPORTING_RUN_BUILD=2.41.2.2431-SNAPSHOT
    REPORTING_RUN_ENVIRONMENT=QA

   ```

=== "`nightwatch.conf.js` file"

Here you can see an example of the full configuration provided via `nightwatch.conf.js` file:

   ```js
    // ...
    reporterOptions: {
        zebrunnerConfig: {
            enabled: true,
            projectKey: 'DEF',
            server: {
                hostname: 'https://mycompany.zebrunner.com',
                accessToken: 'somesecretaccesstoken'
            },
            run: {
                displayName: "Nightly Regression",
                build: '2.41.2.2431-SNAPSHOT',
                environment: 'QA',
            },
        }
    }
    // ...
   ```

## Executing tests using external testing platforms

While executing tests using external testing platforms (Browser Stack, Sauce Labs etc.), it is necessary to define one more Zebrunner capability `zebrunner:provider` in order to track test sessions and their artifacts (such as video) correctly.
Possible values:  "ZEBRUNNER" | "BROWSERSTACK" | "LAMBDATEST" | "SAUCELABS" | "TESTINGBOT".

#### **`nightwatch.conf.js`**
   ```js
    module.exports = {
        // ...
        desiredCapabilities: {
            browserName: "chrome",
            "goog:chromeOptions": {
                w3c: true,
            },
            "zebrunner:provider": "BROWSERSTACK"
        },
        // ...
   };
   ```

## Screenshots

In order to view screenshots taken on failed test in Zebrunner, make sure you enabled them in `nightwatch.conf.js` configuration file:

#### **`nightwatch.conf.js`**
   ```js
    module.exports = {
        // ...
        test_settings: {
            default: {
                screenshots: {
                    enabled: true,
                    path: "screens",
                    on_failure: true,
                    on_error: true,
                },
            },
        },
        // ...
   };
   ```
