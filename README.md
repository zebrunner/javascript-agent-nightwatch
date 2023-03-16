# Zebrunner Nightwatch reporting agent

The official Zebrunner Nightwatch reporting agent.

The Agent works with default Nightwatch runner.

## Inclusion into your project

### Adding dependency

First, you need to add the Zebrunner Agent into your `package.json`.

=== "Yarn"

    ```shell
    yarn add @zebrunner/javascript-agent-nightwatch
    ```

=== "NPM"

    ```shell
    npm install @zebrunner/javascript-agent-nightwatch
    ```

### Reporter setup - Nightwatch runner

The agent does not work automatically after adding it into the project, it requires extra configuration. For this, you need to perform the following 3 steps:

- [Configure global hooks](#1-configure-global-hooks)
- [Add Zebrunner configuration](#2-add-zebrunner-configuration)
- [Update test files](#3-update-test-files)

#### 1. Configure global hooks

Create a new file with global hooks (e.g. `lib/globals.js`) or open an existing one and configure Zebrunner reporting:

1. Import `ZebrunnerReporter`, `ZebrunnerReporterAPI` from `@zebrunner/javascript-agent-nightwatch` package;
2. Import the configuration file of your project (e.g. `nightwatch.conf.js` by default);
3. Add `before`, `after`, `beforeEach` and `afterEach` hook handlers (or update existing ones) to start and finish Zebrunner runs:

```js title="globals.js"
   const { ZebrunnerReporter, ZebrunnerReporterAPI } = require('@zebrunner/javascript-agent-nightwatch');
   const config = require('../nightwatch.conf')
   let zbrReporter;
   
   module.exports = {
      before: async () => {
          zbrReporter = new ZebrunnerReporter(config);
          await zbrReporter.startLaunch();
      },
   
      after: async () => {
          await zbrReporter.finishLaunch();
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

> Please refer to the Nightwatch documentation to learn more about [Global Hooks](https://nightwatchjs.org/guide/writing-tests/global-test-hooks.html).

#### 2. Add Zebrunner configuration

Navigate to the Nightwatch configuration file (by default, it is `nightwatch.conf.js`) and provide the following information:

1. Path to the file with global hooks for `globals_path` variable (in this example, it is `lib/globals.js`);
2. Zebrunner reporter configuration: please refer to the [Reporter configuration](#reporter-configuration) section for more information.

```js title="nightwatch.conf.js"
   module.exports = {
        // ...
        src_folders: ["tests"],
   
        // path to file with Global hooks
        globals_path: "lib/globals.js", 
        
        // Zebrunner reporter configuration
        reporterOptions: {
            zebrunnerConfig: {
                // reporter configuration 
            }
        }
        // ...
   };
```

#### 3. Update test files

Update *ALL* your existing test files with one of the approaches listed below depending on your needs.

a. To track *each test from a file as a separate test in Zebrunner*, use `beforeEach` and `afterEach` hooks. The second optional argument from `#startTest` method will be used as a prefix for all the reported Zebrunner tests. Otherwise, the agent will use the test file name.

- Bdd syntax:
```js
    const { ZebrunnerReporterAPI } = require("@zebrunner/javascript-agent-nightwatch");
   
    describe("Test Suite", function () {
        beforeEach((browser) => {
            ZebrunnerReporterAPI.startTest(browser, "Your test name that will be used as a prefix");
            // or just
            // ZebrunnerReporterAPI.startTest(browser);
        });
   
        afterEach((browser) => {
            ZebrunnerReporterAPI.finishTest(browser);
        });
    });
```

- Exports syntax:
```js
    const { ZebrunnerReporterAPI } = require("@zebrunner/javascript-agent-nightwatch");

    module.exports = {
        beforeEach: function (browser) {
            ZebrunnerReporterAPI.startTest(browser, "Your test name that will be used as a prefix");
            // or just
            // ZebrunnerReporterAPI.startTest(browser);
        },

        afterEach: function (browser) {
            ZebrunnerReporterAPI.finishTest(browser);
        },
    };
```

b. Sometimes it may be useful to track *all test methods from a file as one test in Zebrunner*, e.g., when the tests are written in `module.exports` style and each method effectively represents a test step. In this case, use `before` and `after` hooks to start and finish a Zebrunner test. The `#startTest` method accepts an optional second argument using which you can define a custom name of the test. If the argument is missing, the agent will use the test file name.

- Bdd syntax:
```js
    const { ZebrunnerReporterAPI } = require("@zebrunner/javascript-agent-nightwatch");

    describe("Test Suite", function () {
        before((browser) => {
            ZebrunnerReporterAPI.startTest(browser, "Your test name");
            // or just
            // ZebrunnerReporterAPI.startTest(browser);
        });

        after((browser) => {
            ZebrunnerReporterAPI.finishTest(browser);
        });
    });
```

- Exports syntax:
```js
    const { ZebrunnerReporterAPI } = require("@zebrunner/javascript-agent-nightwatch");

    module.exports = {
        before: function (browser) {
            ZebrunnerReporterAPI.startTest(browser, "Your test name");
            // or just
            // ZebrunnerReporterAPI.startTest(browser);
        },

        after: function (browser) {
            ZebrunnerReporterAPI.finishTest(browser);
        },
    };
```

c. There is one more option that allows you to report *all tests from a file as one test in Zebrunner*, but *without* the need to update all test files. This requires only updating the `beforeEach` and `afterEach` global hooks (by default, they are in `lib/globals.js` file). Using this configuration, logs and screenshots of every test will be displayed in Zebrunner only after the test file is completed.

> This configuration will be applied to *all* test files, so if you need to report test files in different ways within the same launch, this option is not suitable.

```js title="globals.js"
    const { ZebrunnerReporter, ZebrunnerReporterAPI } = require('@zebrunner/javascript-agent-nightwatch');
    const config = require('../nightwatch.conf')
    let zbrReporter;
   
    module.exports = {
        before: async () => {
            zbrReporter = new ZebrunnerReporter(config);
            await zbrReporter.startLaunch();
        },
   
        after: async () => {
            await zbrReporter.finishLaunch();
        },
   
        beforeEach: (browser, done) => {
            ZebrunnerReporterAPI.startTestSession(browser);
            ZebrunnerReporterAPI.startTest(browser);
            done();
        },
   
        afterEach: (browser, done) => {
            ZebrunnerReporterAPI.finishTest(browser);
            ZebrunnerReporterAPI.finishTestSession(browser);
            done();
        },
    };
```

<!-- TODO: necessary to refactor reporter for Mocha runner, so this section is temporary disabled -->

<!-- ### Reporter setup - Mocha runner

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
                                enabled: true,
                                projectKey: 'DEF',
                                server: {
                                    hostname: 'https://mycompany.zebrunner.com',
                                    accessToken: 'somesecretaccesstoken'
                                },
                                // ...
                            },
                        },
                    },
                },
            },
        },
        // ...
   };
``` -->

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
|----------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `REPORTING_ENABLED`<br/>`enabled`                        | Enables or disables reporting. The default value is `false`.                                                                                                                        |
| `REPORTING_PROJECT_KEY`<br/>`projectKey`                 | Optional value. It is the key of Zebrunner project that the launch belongs to. The default value is `DEF`.                                                                          |
| `REPORTING_SERVER_HOSTNAME`<br/>`server.hostname`        | Mandatory if reporting is enabled. It is your Zebrunner hostname, e.g. `https://mycompany.zebrunner.com`.                                                                           |
| `REPORTING_SERVER_ACCESS_TOKEN`<br/>`server.accessToken` | Mandatory if reporting is enabled. The access token is used to perform API calls. It can be obtained in Zebrunner on the 'Account and profile' page in the 'API Access' section. |

#### Automation launch configuration

The following configuration options allow you to configure accompanying information that will be displayed in Zebrunner for the automation launch.

| Env var / Reporter config                                              | Description                                                                                                                                                                                                       |
|------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `REPORTING_LAUNCH_DISPLAY_NAME`<br/>`launch.displayName`                     | Display name of the launch in Zebrunner. The default value is `Default Suite`.                                                                                                                                    |
| `REPORTING_LAUNCH_BUILD`<br/>`launch.build`                                  | Build number associated with the launch. It can reflect either the test build number or the build number of the application under test.                                                                           |
| `REPORTING_LAUNCH_ENVIRONMENT`<br/>`launch.environment`                      | Represents the target environment in which the tests were run. For example, `stage` or `prod`.                                                                                                                    |
| `REPORTING_LAUNCH_LOCALE`<br/>`launch.locale`                                | Locale that will be displayed for the automation launch in Zebrunner. For example, `en_US`.                                                                                                                       |
| `REPORTING_LAUNCH_TREAT_SKIPS_AS_FAILURES`<br/>`launch.treatSkipsAsFailures` | If the value is set to `true`, skipped tests will be treated as failures when the result of the entire launch is calculated, otherwise skipped tests will be considered as passed. The default value is `true`. |
| `<N/A>`<br/>`launch.labels`                                               | Object with labels to be attached to the current launch. Property name is the label key, property value is the label value. Label value must be a string.                                                       |
| `<N/A>`<br/>`launch.artifactReferences`                                   | Object with artifact references to be attached to the current launch. Property name is the artifact reference name, property value is the artifact reference value. Value must be a string.                     |

#### Milestone

Zebrunner Milestone for the automation launch can be configured using the following configuration options (all of them are optional).

| Env var / Reporter config                       | Description                                                                                                                                                                                                                           |
|-------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `REPORTING_MILESTONE_ID`<br/>`milestone.id`     | Id of the Zebrunner Milestone to link the automation launch to. The id is not displayed on Zebrunner UI, so the field is basically used for internal purposes. If the milestone does not exist, the launch will continue executing. |
| `REPORTING_MILESTONE_NAME`<br/>`milestone.name` | Name of the Zebrunner Milestone to link the automation launch to. If the milestone does not exist, the appropriate warning message will be displayed in logs, but the test suite will continue executing.                           |

#### Notifications

Zebrunner provides notification capabilities for automation launch results. The following options configure notification rules and targets.

| Env var / Reporter config                                                               | Description                                                                                                                                                                                                                                                                                                                                                              |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `REPORTING_NOTIFICATION_NOTIFY_ON_EACH_FAILURE`<br/>`notifications.notifyOnEachFailure` | Specifies whether Zebrunner should send notifications to Slack/Teams on each test failure. The notifications will be sent even if the launch is still running. The default value is `false`.                                                                                                                                                                             |
| `REPORTING_NOTIFICATION_SLACK_CHANNELS`<br/>`notifications.slackChannels`               | A comma-separated list of Slack channels to send notifications to. Notifications will be sent only if the Slack integration is properly configured in Zebrunner with valid credentials for the project the launch is reported to. Zebrunner can send two types of notifications: on each test failure (if the appropriate property is enabled) and on the launch finish. |
| `REPORTING_NOTIFICATION_MS_TEAMS_CHANNELS`<br/>`notifications.teamsChannels`            | A comma-separated list of Microsoft Teams channels to send notifications to. Notifications will be sent only if the Teams integration is configured in the Zebrunner project with valid webhooks for the channels. Zebrunner can send two types of notifications: on each test failure (if the appropriate property is enabled) and on the launch finish.                |
| `REPORTING_NOTIFICATION_EMAILS`<br/>`notifications.emails`                              | A comma-separated list of emails to send notifications to. This type of notifications does not require further configuration on Zebrunner side. Unlike other notification mechanisms, Zebrunner can send emails only on the launch finish.                                                                                                                               |

#### Integration with Test Case Management systems

Zebrunner integrates with different Test Case Management (TCM) systems and provides the following capabilities:

1. Linking test cases to test executions
2. Previewing linked test cases in Zebrunner
3. Pushing test execution results to the TCM system

This functionality is currently supported only for Zebrunner Test Case Management, TestRail, Xray, Zephyr Squad and Zephyr Scale.

The link between execution of a test method and corresponding test cases can only be set from within the test method code. For more information about this, see the [Linking test cases to test executions](#linking-test-cases-to-test-executions) section.

If you want to push the execution results to the TCM system, you need to provide additional configuration for the Agent. For all the supported TCMs, Zebrunner can push results to a pre-created test suite execution (this term has a different name in different systems). For TestRail, you can also create a new Test Run based on the Agent configuration and push the results into it. If enabled, the push can be performed either at the end of the whole test run, or in real time after each test.

The following subsection covers how to provide configuration for pushing results to each of the TCM systems.


##### Zebrunner Test Case Management (TCM)

| Env var / Reporter config                                                      | Description                                                                                                                                                             |
|--------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `REPORTING_TCM_ZEBRUNNER_PUSH_RESULTS`<br/>`tcm.zebrunner.pushResults`         | Boolean value which specifies if the execution results should be pushed to Zebrunner TCM. The default value is `false`.                                                 |
| `REPORTING_TCM_ZEBRUNNER_PUSH_IN_REAL_TIME`<br/>`tcm.zebrunner.pushInRealTime` | Boolean value. Specifies whether to push execution results immediately after each test is finished (value `true`) or not (value `false`). The default value is `false`. |
| `REPORTING_TCM_ZEBRUNNER_TEST_RUN_ID`<br/>`tcm.zebrunner.testRunId`            | Numeric id of the target Test Run in Zebrunner TCM. If a value is not provided, no new runs will be created.                                                            |


##### TestRail

| Env var / Reporter config                                                                      | Description                                                                                                                                                                                                                                            |
|------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `REPORTING_TCM_TESTRAIL_PUSH_RESULTS`<br/>`tcm.testRail.pushResults`                           | Boolean value which specifies if the execution results should be pushed to TestRail. The default value is `false`.                                                                                                                                     |
| `REPORTING_TCM_TESTRAIL_PUSH_IN_REAL_TIME`<br/>`tcm.testRail.pushInRealTime`                   | Boolean value. Specifies whether to push execution results immediately after each test is finished (value `true`) or not (value `false`). The default value is `false`. Enabling of this option forces the `includeAllTestCasesInNewRun` to be `true`. |
| `REPORTING_TCM_TESTRAIL_SUITE_ID`<br/>`tcm.testRail.suiteId`                                   | Specifies the numeric id of the TestRail Suite in which the tests reside. TestRail displays the ids prefixed with 'S' letter. You need to provide the id without this letter.                                                                          |
| `REPORTING_TCM_TESTRAIL_RUN_ID`<br/>`tcm.testRail.runId`                                       | The id of the TestRail Test Run where the results should be pushed. TestRail displays the ids prefixed with 'R' letter. You need to provide the id without this letter.                                                                             |
| `REPORTING_TCM_TESTRAIL_RUN_NAME`<br/>`tcm.testRail.runName`                                   | Specifies the name of a new Test Run in TestRail. If push is enabled and run id is not provided, Zebrunner will create a new run in TestRail. If the value is not provided, Zebrunner will use the launch display name.                                |
| `REPORTING_TCM_TESTRAIL_INCLUDE_ALL_IN_NEW_RUN`<br/>`tcm.testRail.includeAllTestCasesInNewRun` | If the value is set to `true`, all cases from the Suite will be added to the newly created Test Run. The value is forced to be `true` if real-time push is enabled. Default value is `false`.                                                          |
| `REPORTING_TCM_TESTRAIL_MILESTONE_NAME`<br/>`tcm.testRail.milestoneName`                       | The newly created Test Run will be associated with the milestone specified using this property.                                                                                                                                                        |
| `REPORTING_TCM_TESTRAIL_ASSIGNEE`<br/>`tcm.testRail.assignee`                                  | Assignee of the newly created Test Run. The value should be the email of an existing TestRail user.                                                                                                                                                    |


##### Xray

| Env var / Reporter config                                            | Description                                                                                                                                                             |
|----------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `REPORTING_TCM_XRAY_PUSH_RESULTS`<br/>`tcm.xray.pushResults`         | Boolean value which specifies if the execution results should be pushed to Xray. The default value is `false`.                                                          |
| `REPORTING_TCM_XRAY_PUSH_IN_REAL_TIME`<br/>`tcm.xray.pushInRealTime` | Boolean value. Specifies whether to push execution results immediately after each test is finished (value `true`) or not (value `false`). The default value is `false`. |
| `REPORTING_TCM_XRAY_EXECUTION_KEY`<br/>`tcm.xray.executionKey`       | The key of the Xray Execution where the results should be pushed.                                                                                                       |


##### Zephyr

| Env var / Reporter config                                                | Description                                                                                                                                                             |
|--------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `REPORTING_TCM_ZEPHYR_PUSH_RESULTS`<br/>`tcm.zephyr.pushResults`         | Boolean value which specifies if the execution results should be pushed to Zephyr. The default value is `false`.                                                        |
| `REPORTING_TCM_ZEPHYR_PUSH_IN_REAL_TIME`<br/>`tcm.zephyr.pushInRealTime` | Boolean value. Specifies whether to push execution results immediately after each test is finished (value `true`) or not (value `false`). The default value is `false`. |
| `REPORTING_TCM_ZEPHYR_JIRA_PROJECT_KEY`<br/>`tcm.zephyr.jiraProjectKey`  | Specifies the key of the Jira project where the tests reside.                                                                                                           |
| `REPORTING_TCM_ZEPHYR_TEST_CYCLE_KEY`<br/>`tcm.zephyr.testCycleKey`      | The key of the Zephyr Test Cycle where the results should be pushed.                                                                                                    |


##### Custom Result Statuses

By default, when the execution results are being pushed to a TCM system, Zebrunner maps each test execution result to an appropriate result status in the target TCM system. Most of the time this works perfectly, but in some cases Zebrunner is not able to derive the appropriate target result status.

One of the examples of such cases is when a test case result status does not correlate with the test execution status, or when you have conditional logic determining the actual result status for the test case. For such cases, the Agent comes with a special method which sets a specific Result Status to the test case. For more information about this, see the [Linking test cases to test executions](#linking-test-cases-to-test-executions) section.

Another example is custom Result Statuses in the target TCM system. In this case, we cannot anticipate the correct status and simply skip the test execution. In order to tackle this, Zebrunner allows you to configure default status for passed and failed test executions (for skipped tests, this is not technically possible).

| Env var / Reporter config                                                | Description                                                                                              |
|--------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| `REPORTING_TCM_TEST_CASE_STATUS_ON_PASS`<br/>`tcm.testCaseStatus.onPass` | The default status that will be assigned to passed test executions when they are pushed to a TCM system. |
| `REPORTING_TCM_TEST_CASE_STATUS_ON_FAIL`<br/>`tcm.testCaseStatus.onFail` | The default status that will be assigned to failed test executions when they are pushed to a TCM system. |

When pushing results to a TCM system, Zebrunner derives the Result Status in the following order:

1. Checks the explicitly assigned value (which was assigned using the `#testCaseStatus()` method).
2. Takes the default status provided via configuration for passed and/or failed tests.
3. Uses internal mapping of Zebrunner statuses to the Result Statuses of the target TCM system.

### Examples

#### Environment Variables

The following code snippet is a list of all configuration environment variables from `.env` file:

```text
   REPORTING_ENABLED=true
   REPORTING_PROJECT_KEY=DEF
   REPORTING_SERVER_HOSTNAME=https://mycompany.zebrunner.com
   REPORTING_SERVER_ACCESS_TOKEN=somesecretaccesstoken
   
   REPORTING_LAUNCH_DISPLAY_NAME=Nightly Regression
   REPORTING_LAUNCH_BUILD=2.41.2.2431-SNAPSHOT
   REPORTING_LAUNCH_ENVIRONMENT=QA
   REPORTING_LAUNCH_LOCALE=en_US
   REPORTING_LAUNCH_TREAT_SKIPS_AS_FAILURES=true
   
   REPORTING_MILESTONE_ID=1
   REPORTING_MILESTONE_NAME=Release 1.0.0
   
   REPORTING_NOTIFICATION_NOTIFY_ON_EACH_FAILURE=false
   REPORTING_NOTIFICATION_SLACK_CHANNELS=dev, qa
   REPORTING_NOTIFICATION_MS_TEAMS_CHANNELS=dev-channel, management
   REPORTING_NOTIFICATION_EMAILS=manager@mycompany.com
   
   REPORTING_TCM_TEST_CASE_STATUS_ON_PASS=PASS
   REPORTING_TCM_TEST_CASE_STATUS_ON_FAIL=FAIL
   
   REPORTING_TCM_ZEBRUNNER_PUSH_RESULTS=false
   REPORTING_TCM_ZEBRUNNER_PUSH_IN_REAL_TIME=true
   REPORTING_TCM_ZEBRUNNER_TEST_RUN_ID=17
   
   REPORTING_TCM_TESTRAIL_PUSH_RESULTS=false
   REPORTING_TCM_TESTRAIL_PUSH_IN_REAL_TIME=true
   REPORTING_TCM_TESTRAIL_SUITE_ID=100
   REPORTING_TCM_TESTRAIL_RUN_ID=500
   REPORTING_TCM_TESTRAIL_INCLUDE_ALL_IN_NEW_RUN=true
   REPORTING_TCM_TESTRAIL_RUN_NAME=Nightwatch Run
   REPORTING_TCM_TESTRAIL_MILESTONE_NAME=Nightwatch Milestone
   REPORTING_TCM_TESTRAIL_ASSIGNEE=tester@mycompany.com
   
   REPORTING_TCM_XRAY_PUSH_RESULTS=false
   REPORTING_TCM_XRAY_PUSH_IN_REAL_TIME=true
   REPORTING_TCM_XRAY_EXECUTION_KEY=QT-100
   
   REPORTING_TCM_ZEPHYR_PUSH_RESULTS=false
   REPORTING_TCM_ZEPHYR_PUSH_IN_REAL_TIME=true
   REPORTING_TCM_ZEPHYR_JIRA_PROJECT_KEY=ZEB
   REPORTING_TCM_ZEPHYR_TEST_CYCLE_KEY=ZEB-T1
```

#### Configuration file

Below you can see an example of the full configuration provided via `nightwatch.conf.js` file:

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
         launch: {
            displayName: "Nightly Regression",
            build: '2.41.2.2431-SNAPSHOT',
            environment: 'QA',
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
            emails: 'manager@mycompany.com',
         },
         tcm: {
            testCaseStatus: {
               onPass: 'PASS',
               onFail: 'FAIL',
            },
            zebrunner: {
               pushResults: false,
               pushInRealTime: true,
               testRunId: 17,
            },
            testRail: {
               pushResults: false,
               pushInRealTime: true,
               suiteId: 100,
               runId: 500,
               includeAllTestCasesInNewRun: true,
               runName: 'Nightwatch Run',
               milestoneName: 'Nightwatch Milestone',
               assignee: 'tester@mycompany.com',
            },
            xray: {
               pushResults: false,
               pushInRealTime: true,
               executionKey: 'QT-100',
            },
            zephyr: {
               pushResults: false,
               pushInRealTime: true,
               jiraProjectKey: 'ZEB',
               testCycleKey: 'ZEB-T1',
            },
         },
      }
   }
   // ...
```

## Launcher configuration
Zebrunner Launcher provides a great way to execute tests without having to worry about the runtime environment.

> To learn more about the Zebrunner Launcher and all it's capabilities, refer to the [Zebrunner Launcher](https://zebrunner.com/documentation/guide/launchers/) documentation page.

The Nightwatch Agent is fully integrated with the Zebrunner Launcher and requires even less configuration when used with it. The Zebrunner Launcher automatically provides `REPORTING_ENABLED`, `REPORTING_PROJECT_KEY`, `REPORTING_SERVER_HOSTNAME`, `REPORTING_SERVER_ACCESS_TOKEN` and some other environment variables, so there is no need to explicitly specify them or the corresponding `nightwatch.conf.js` file properties.

If you have included the Zebrunner Agent into your project and pushed the changes to a Git repository, you can easily run your tests using Zebrunner Launcher. For this, you need to navigate to Zebrunner Launcher and add the Git repository (if you have not already). Next, add a new Launcher for the Git repo.

Configuration of the Launcher for Nightwatch tests is pretty straightforward:

1. Add a meaningful name for the Launcher.
2. Select a Git branch to launch tests from.
3. Make sure the **Zebrunner Executor** is selected as the Execution Environment.
4. Enter or select a docker image to run the tests. The simplest choice for Nightwatch is the regular `node` docker image, e.g. `node:latest`.
5. Enter the launch command. Since each launch with Zebrunner Launcher starts from scratch, you need to install project dependencies as part of the launch command.
   An example of the launch command is `npm install && npm run test` (assuming you have a correct script with name 'test' in your `package.json` file).
6. If necessary, add environment variables that will be passed to the tests at runtime.
7. Select a configured Testing Platform (e.g. Zebrunner Selenium Grid) along with operating system and/or desired browser/device. More information about how the selected Testing Platform and capabilities are processed can be found in the next subsection.
8. If the launcher is configured, hit the **Add** button at the bottom of the page.

![Example of launcher configuration](./images/launcher_config.png)

Now you can launch the tests using Zebrunner Launcher. To do this, click the **Launch** button which is located under the configuration of the selected launcher.

If something went wrong while running the tests, you can examine the logs captured from the docker container. If the launch is stuck in "In Progress" status and there is no link to the logs file, you need to manually abort the launch in the 3-dot menu.

### Testing platform and capabilities

The Zebrunner Agent will substitute the Selenium server and capabilities configurations with the values selected in the **Testing platform** section of Zebrunner Launcher. For example, if you select **Zebrunner Selenium Grid** as a testing platform and select the `Linux` platform and `Chrome 105.0` browser, the Zebrunner Agent will apply the selected configuration in your `nightwatch.conf.js` file.

It is only necessary to import `ZebrunnerConfigurator` and wrap Selenium Grid configuration as an argument for `ZebrunnerConfigurator.configureLauncher` function. If the tests will be executed using Zebrunner Launcher, this method will configure everything what you need, otherwise the original configuration will be returned.

The example below shows a newly defined environment `zebrunner` with wrapped configuration, but you can update the existing one in a similar way.

```js title="nightwatch.conf.js"
    const { ZebrunnerConfigurator } = require('@zebrunner/javascript-agent-nightwatch');

    module.exports = {
        // ...
        test_settings: {
            // `default` environment
            default: {
            },

            // `zebrunner` environment
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
                    "zebrunner:provider": "ZEBRUNNER"
                },
            }),
            // ...
        },
    };
```

When the configuration is added, you will be able to execute the tests against this environment using the command `npx nightwatch tests/ --env zebrunner` or `npm run test -- --env zebrunner` — depending on scripts defined in your `package.json`.

> The added environment can be used in 2 ways:
>
> 1. Using Zebrunner Launcher: in this case, Zebrunner Agent will automatically substitute the Selenium server and capabilities according to the provided information on the Launchers page;
> 2. While running tests locally but using remote browsers with Zebrunner Selenium Grid: in this case, you should provide valid Selenium information for the `host`, `port`, `username` and `access_key` fields.

> Please refer to the documentation to learn more about [Nightwatch environments](https://nightwatchjs.org/guide/configuration/define-test-environments.html).

## Executing tests via external testing platforms

While executing tests using external testing platforms (BrowserStack, Sauce Labs, etc.), it is necessary to define one more Zebrunner capability `zebrunner:provider` in order to track test sessions and their artifacts (such as video) correctly.

Possible values:  "ZEBRUNNER" | "BROWSERSTACK" | "LAMBDATEST" | "SAUCELABS" | "TESTINGBOT".

```js title="nightwatch.conf.js"
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

## Collecting screenshots

The Zebrunner Agent allows you to take screenshots both  automatically and manually, and send them into Zebrunner Reporting.

Automatic screenshot capturing is possible after a test fails, so make sure you've enabled it in the `nightwatch.conf.js` configuration file:

```js title="nightwatch.conf.js"
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

Manually taken screenshots can be sent to Zebrunner using the `#saveScreenshot(browser)` method of the `CurrentTest` object. 

```js
    const { CurrentTest } = require("@zebrunner/javascript-agent-nightwatch");
    
    module.exports = {
        beforeEach(browser) {
            ZebrunnerReporterAPI.startTest(browser);
        },
    
        afterEach(browser) {
            ZebrunnerReporterAPI.finishTest(browser);
        },
    
        'first test': (browser) => {
            CurrentTest.saveScreenshot(browser);
            // ...
        },
    };
```

In addition, Nightwatch provides the possibility to create custom commands, which can be much useful in chaining. For example:
 
1. Create a file `commands/takeScreenshot.js` with the following code snippet:

```js
    const { CurrentTest } = require("@zebrunner/javascript-agent-nightwatch");

    module.exports = {
        command() {
            return this.perform(() => {
                CurrentTest.saveScreenshot(this);
            });
        },
    };
```

2. Specify the path to the `commands` folder in the `nightwatch.conf.json` file for the `custom_commands_path` property.
3. Use the newly created command in the tests:

```js
    const { CurrentTest } = require("@zebrunner/javascript-agent-nightwatch");
    
    module.exports = {
        beforeEach(browser) {
            ZebrunnerReporterAPI.startTest(browser);
        },
    
        afterEach(browser) {
            ZebrunnerReporterAPI.finishTest(browser);
        },
    
        'first test': (browser) => {
            browser
                .url('https://www.ecosia.org')
                .waitForElementVisible('body')
                .takeScreenshot()
                .assert.titleContains('Ecosia')
                .assert.visible('input[type=search]')
                .setValue('input[type=search]', 'nightwatch')
                .takeScreenshot()
                .assert.visible('button[type=submit]');
        },
    };
```

> Please refer to the Nightwatch documentation to learn more about [Custom commands](https://nightwatchjs.org/guide/extending-nightwatch/adding-custom-commands.html).

## Tracking test maintainer

You may want to add transparency to the process of automation maintenance by having an engineer responsible for evolution of specific tests or test suites. To serve that purpose, Zebrunner comes with a concept of a maintainer.

In order to keep track of those, the Agent comes with the `#setMaintainer()` method of the `CurrentTest` object. This method accepts the username of an existing Zebrunner user. If there is no user with the given username, `anonymous` will be assigned.

```js
    const { CurrentTest } = require("@zebrunner/javascript-agent-nightwatch");
    
    module.exports = {
        beforeEach(browser) {
            ZebrunnerReporterAPI.startTest(browser);
    
            CurrentTest.setMaintainer(browser, 'developer'); // will be set for all tests from the file
        },
    
        afterEach(browser) {
            ZebrunnerReporterAPI.finishTest(browser);
        },
    
        'first test': (browser) => {
            CurrentTest.setMaintainer(browser, 'tester'); // will be set only for this test
            // ...
        },
    
        'second test': (browser) => {
            // ...
        },
    };
```

In this example, `developer` will be reported as a maintainer of `second test` (because the value is set in `beforeEach()`), while `tester` will be reported as a maintainer of the `first test` (overrides value set in `beforeEach()`).

## Attaching labels to test and launch

In some cases, it may be useful to attach meta information related to a test or the entire run.

The agent comes with a concept of labels. Label is a simple key-value pair. The label key is represented by a string, the label value accepts a vararg of strings.

To attach a label to a test, you need to invoke the `#attachLabel()` method of the `CurrentTest` object in scope of the test method. Also, you can use this method in `beforeEach()` that means such labels will be assigned for all test cases from the file.
To attach label to the entire run, you can either invoke the `attachLabel` method of the `CurrentLaunch` object or provide the labels in the [configuration file](#automation-launch-configuration).

```js
    const { CurrentLaunch, CurrentTest } = require("@zebrunner/javascript-agent-nightwatch");

    module.exports = {
        beforeEach(browser) {
            CurrentLaunch.attachLabel('run_label', 'first', 'second');

            ZebrunnerReporterAPI.startTest(browser);

            CurrentTest.attachLabel(browser, 'test_label', 'before_1', 'before_2');
        },

        afterEach(browser) {
            ZebrunnerReporterAPI.finishTest(browser);
        },

        'first test': (browser) => {
            CurrentLaunch.attachLabel('feature', 'smoke');

            CurrentTest.attachLabel(browser, 'test', 'pass');
            CurrentTest.attachLabel(browser, 'owner', 'developer');
            // ...
        },
    };
```

## Attaching artifact references to test and launch

Labels are not the only option for attaching meta information to a test and launch. If the information you want to attach is a link (to a file or webpage), it is more useful to attach it as an artifact reference (or to put it simply as a link).

The `#attachArtifactReference()` methods of the `CurrentTest` and `CurrentLaunch` objects serve exactly this purpose. These methods accept two arguments. The first one is the artifact reference name which will be shown in Zebrunner. The second one is the artifact reference value.
Also, you can use `CurrentTest.attachArtifactReference()` in `beforeEach()` hook that means a reference will be assigned for all the test cases from the file.

Moreover, you can attach artifact references to the entire launch by specifying them in the [configuration file](#automation-launch-configuration).

```js
    const { CurrentLaunch, CurrentTest } = require("@zebrunner/javascript-agent-nightwatch");

    module.exports = {
        beforeEach(browser) {
            CurrentLaunch.attachArtifactReference('documentation', 'https://zebrunner.com/documentation/');

            ZebrunnerReporterAPI.startTest(browser);
            CurrentTest.attachArtifactReference(browser, 'github', 'https://github.com/zebrunner');
        },

        afterEach(browser) {
            ZebrunnerReporterAPI.finishTest(browser);
        },

        'first test': (browser) => {
            CurrentTest.attachArtifactReference(browser, 'nightwatch', 'https://nightwatchjs.org/');
            // ...
        },
    };
```

## Attaching artifacts to test and launch

In case your tests or the entire launch produce some artifacts, it may be useful to track them in Zebrunner. The agent comes with a few convenient methods for uploading artifacts in Zebrunner and linking them to the currently running test or the launch.

The `#uploadArtifactBuffer()` and `#uploadArtifactFromFile()` methods of the `CurrentTest` and `CurrentLaunch` objects serve exactly this purpose.
Also, you can use methods mentioned above from `CurrentTest` in `beforeEach()` hook that means the artifact will be assigned for all test cases from the file.

```js
    const { CurrentLaunch, CurrentTest } = require("@zebrunner/javascript-agent-nightwatch");
    const fs = require('fs');

    module.exports = {
        beforeEach(browser) {
            CurrentLaunch.uploadArtifactFromFile("configuration", "./images/launcher_config.png");

            const buffer = fs.readFileSync("./screens/fileName.png")
            CurrentLaunch.uploadArtifactBuffer('artifact_image_name', 'image/png', buffer);

            ZebrunnerReporterAPI.startTest(browser);

            CurrentTest.uploadArtifactFromFile(browser, "readme", "./README.md");
        },

        afterEach(browser) {
            ZebrunnerReporterAPI.finishTest(browser);
        },

        'first test': (browser) => {
            CurrentTest.uploadArtifactFromFile(browser, "some useful screenshot", "./screens/fileName.png");
            // ...
        },
    };
```

## Reverting test registration

In some cases, it might be handy not to register test executions in Zebrunner. This may be caused by very special circumstances of a test environment or execution conditions.

Zebrunner Agent comes with a convenient method `#revertRegistration()` of the `CurrentTest` object for reverting test registration at runtime. The following code snippet shows a case where a test is not reported on Monday.

```js
    const { CurrentTest } = require("@zebrunner/javascript-agent-nightwatch");

    module.exports = {
        beforeEach(browser) {
            ZebrunnerReporterAPI.startTest(browser);
        },

        afterEach(browser) {
            ZebrunnerReporterAPI.finishTest(browser);
        },

        'first test': (browser) => {
            if (new Date().getDay() === 1) {
                CurrentTest.revertRegistration(browser);
            }
            // ...
        },
    };
```

It is worth mentioning that the method invocation does not affect the test execution, but simply unregisters the test in Zebrunner. To interrupt the test execution, you need to perform additional actions, for example, throw an Error.

## Linking test cases to test executions

> To learn more about pushing results to a TCM system, see the [Integration with Test Case Management systems](#integration-with-test-case-management-systems) section.

### Zebrunner TCM

The Agent comes with the `Zebrunner` object which contains methods to link test cases to a currently executing test:

- `#testCaseKey(browser, ...testCaseKeys)` — accepts a list of test cases which should be linked to the current test;
- `#testCaseStatus(browser, testCaseKey, resultStatus)` — links one test case and provides\overrides its result status. This may be useful if the test case result status does not correlate with the test execution status or if you have conditional logic determining the actual result status for the test case.

If these methods are invoked for the same test case id many times within a test method, the last invocation will take precedence. For example, if you invoke the `#testCaseStatus(browser, 'KEY-1', 'SKIPPED')` first, and then invoke the `#testCaseKey(browser, 'KEY-1')`, then the result status you provided in the first invocation will be ignored.

```js
    const { Zebrunner } = require("@zebrunner/javascript-agent-nightwatch");

    module.exports = {
        beforeEach(browser) {
            ZebrunnerReporterAPI.startTest(browser);
        },

        afterEach(browser) {
            ZebrunnerReporterAPI.finishTest(browser);
        },

        'first test': (browser) => {
            Zebrunner.testCaseKey(browser, 'KEY-100', 'KEY-200');
            // ...
        },

        'second test': (browser) => {
            Zebrunner.testCaseKey(browser, 'KEY-300', 'KEY-400');
            // ...
            if (someCondition) {
                // overriddes the status of the test case when results are pushed to the Zebrunner TCM.
                // using this method, you can manually specify the desired result status. 
                Zebrunner.testCaseStatus(browser, 'KEY-300', 'SKIPPED');
            }
        },
    };
```

### TestRail

The Agent comes with the `TestRail` object which contains methods to link test cases to a currently executing test:

- `#testCaseId(browser, ...testCaseIds)` — accepts a list of test cases which should be linked to current test;
- `#testCaseStatus(browser, testCaseId, resultStatus)` — links one test case and provides\overrides its result status. This may be useful if the test case result status does not correlate with the test execution status, or if you have conditional logic determining the actual result status for the test case.

If these methods are invoked for the same test case id many times within a test method, the last invocation will take precedence. For example, if you invoke the `#testCaseStatus(browser, 'C1', 'SKIPPED')` first and then invoke the `#testCaseId(browser, 'C1')`, then the result status you provided in the first invocation will be ignored.

```js
    const { TestRail } = require("@zebrunner/javascript-agent-nightwatch");

    module.exports = {
        beforeEach(browser) {
            ZebrunnerReporterAPI.startTest(browser);
        },

        afterEach(browser) {
            ZebrunnerReporterAPI.finishTest(browser);
        },

        'first test': (browser) => {
            TestRail.testCaseId(browser, '1000', 'C2000');
            // ...
        },

        'second test': (browser) => {
            TestRail.testCaseId(browser, '3000', '4000');
            // ...
            if (someCondition) {
                // overriddes the status of the test case when results are pushed to the TestRail.
                // by default Zebrunner maps the test execution result to a result status from TestRail.
                // using this method, you can manually specify the desired result status. 
                TestRail.testCaseStatus(browser, '3000', 'SKIPPED');
            }
        },
    };
```

### Xray

The Agent comes with the `Xray` object which contains methods to link test cases to a currently executing test:

- `#testCaseKey(browser, ...testCaseKeys)` — accepts a list of test cases which should be linked to current test;
- `#testCaseStatus(browser, testCaseKey, resultStatus)` — links one test case and provides\overrides its result status. This may be useful if the test case result status does not correlate with the test execution status, or if you have conditional logic determining the actual result status for the test case.

If these methods are invoked for the same test case id many times within a test method, the last invocation will take precedence. For example, if you invoke the `#testCaseStatus(browser, 'KEY-1', 'SKIPPED')` first, and then invoke the `#testCaseKey(browser, 'KEY-1')`, then the result status you provided in the first invocation will be ignored.

```js
    const { Xray } = require("@zebrunner/javascript-agent-nightwatch");

    module.exports = {
        beforeEach(browser) {
            ZebrunnerReporterAPI.startTest(browser);
        },

        afterEach(browser) {
            ZebrunnerReporterAPI.finishTest(browser);
        },

        'first test': (browser) => {
            Xray.testCaseKey(browser, 'QT-100');
            // ...
        },

        'second test': (browser) => {
            Xray.testCaseKey(browser, 'QT-200', 'QT-300');
            // ...
            if (someCondition) {
                // overriddes the status of the test case when results are pushed to the Xray.
                // by default Zebrunner maps the test execution result to a result status from Xray.
                // using this method, you can manually specify the desired result status. 
                Xray.testCaseStatus(browser, 'QT-200', 'SKIPPED');
            }
        },
    };
```

### Zephyr

The Agent comes with the `Zephyr` object which contains methods to link test cases to a currently executing test:

- `#testCaseKey(browser, ...testCaseKeys)` — accepts a list of test cases which should be linked to current test;
- `#testCaseStatus(browser, testCaseKey, resultStatus)` — links one test case and provides\overrides its result status. This may be useful if the test case result status does not correlate with the test execution status, or if you have conditional logic determining the actual result status for the test case.

If these methods are invoked for the same test case id many times within a test method, the last invocation will take precedence. For example, if you invoke the `#testCaseStatus(browser, 'KEY-1', 'SKIPPED')` first, and then invoke the `#testCaseKey(browser, 'KEY-1')`, then the result status you provided in the first invocation will be ignored.

```js
    const { Zephyr } = require("@zebrunner/javascript-agent-nightwatch");

    module.exports = {
        beforeEach(browser) {
            ZebrunnerReporterAPI.startTest(browser);
        },

        afterEach(browser) {
            ZebrunnerReporterAPI.finishTest(browser);
        },

        'first test': (browser) => {
            Zephyr.testCaseKey(browser, 'QT-T1');
            // ...
        },

        'second test': (browser) => {
            Zephyr.testCaseKey(browser, 'QT-T1', 'QT-T2');
            // ...
            if (someCondition) {
                // overriddes the status of the test case when results are pushed to the Zephyr.
                // by default Zebrunner maps the test execution result to a result status from Zephyr.
                // using this method, you can manually specify the desired result status. 
                Zephyr.testCaseStatus(browser, 'QT-T1', 'SKIPPED');
            }
        },
    };
```
