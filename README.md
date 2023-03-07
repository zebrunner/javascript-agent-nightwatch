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
    const { ZebrunnerReporter, ZebrunnerReporterAPI } = require('@zebrunner/javascript-agent-nightwatch');
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
                    locale: 'en_US',
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
            }
        }
        // ...
   };
   ```
3. Update your *ALL* existing test files with one of the approach below depends on your needs.

NOTE: you can use only one approach within a test file, but different test files from one execution (test run) can use any of those options.

a. if you wish to track *all tests from the file as one test in Zebrunner*, use `before` and `after` hooks handlers to start and finish Zebrunner test as on examples below. You can define the second argument (`Your test name` in this case), if you want to see a custom name of the test. In case of absence, the agent will use test file name.

- Bdd syntax
   ```js
    const { ZebrunnerReporterAPI } = require("@zebrunner/javascript-agent-nightwatch");

    describe("Test Suite", function () {

        before((browser) => {
            ZebrunnerReporterAPI.startTest(browser, "Your test name");
            // or just
            // ZebrunnerReporterAPI.startTest(browser);
        });

        after((browser) => {
            ZebrunnerReporterAPI.finishTest(browser, "Your test name");
            // or just
            // ZebrunnerReporterAPI.finishTest(browser);
        });
    });
   ```
- Exports syntax
   ```js
    const { ZebrunnerReporterAPI } = require("@zebrunner/javascript-agent-nightwatch");

    module.exports = {

        before: function (browser) {
            ZebrunnerReporterAPI.startTest(browser, "Your test name");
            // or just
            // ZebrunnerReporterAPI.startTest(browser);
        },

        after: function (browser) {
            ZebrunnerReporterAPI.finishTest(browser, "Your test name");
            // or just
            // ZebrunnerReporterAPI.finishTest(browser);
        },
    };
   ```

b. if you wish to track tests in classic manner i.e. *each test from the file as separate test in Zebrunner*, use `beforeEach` and `afterEach` hooks handlers. The second optional argument will be used as prefix of all reported Zebrunner tests. Otherwise, the agent will use running test file name.

- Bdd syntax
   ```js
    const { ZebrunnerReporterAPI } = require("@zebrunner/javascript-agent-nightwatch");

    describe("Test Suite", function () {

        beforeEach((browser) => {
            ZebrunnerReporterAPI.startTest(browser, "Your test name that will be used as prefix");
            // or just
            // ZebrunnerReporterAPI.startTest(browser);
        });

        afterEach((browser) => {
            ZebrunnerReporterAPI.finishTest(browser, "Your test name that will be used as prefix");
            // or just
            // ZebrunnerReporterAPI.finishTest(browser);
        });
    });
   ```
- Exports syntax
   ```js
    const { ZebrunnerReporterAPI } = require("@zebrunner/javascript-agent-nightwatch");

    module.exports = {

        beforeEach: function (browser) {
            ZebrunnerReporterAPI.startTest(browser, "Your test name that will be used as prefix");
            // or just
            // ZebrunnerReporterAPI.startTest(browser);
        },

        afterEach: function (browser) {
            ZebrunnerReporterAPI.finishTest(browser, "Your test name that will be used as prefix");
            // or just
            // ZebrunnerReporterAPI.finishTest(browser);
        },
    };
   ```
c. if you want to track *all tests from the file as one test in Zebrunner* for all your files in the framework, use `beforeEach` and `afterEach` hooks handlers from `lib/globals.js`. In this case, configuration is mandatory only for this file with global hooks and *not* necessary to update each test file. 

NOTE: using this configuration, logs and screenshots of the test will be displayed in Zebrunner when a whole test file is finished.

#### **`globals.js`**
   ```js
    const { ZebrunnerReporter, ZebrunnerReporterAPI } = require('@zebrunner/javascript-agent-nightwatch');
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
| `REPORTING_RUN_BUILD`<br/>`run.build` | Build number associated with the launch. It can reflect either the test build number or the build number of the application under test. |
| `REPORTING_RUN_ENVIRONMENT`<br/>`run.environment` | Represents the target environment in which the tests were run. For example, `stage` or `prod`. |
| `REPORTING_RUN_LOCALE`<br/>`run.locale` | Locale that will be displayed for the automation run in Zebrunner. For example,`en_US`. |
| `REPORTING_RUN_TREAT_SKIPS_AS_FAILURES`<br/>`run.treatSkipsAsFailures` | If the value is set to `true`, skipped tests will be treated as failures when the result of the entire test run is calculated, otherwise skipped tests will be considered as passed. The default value is `true`. |
| `<N/A>`<br/>`run.labels` | Object with labels to be attached to the current test run. Property name is the label key, property value is the label value. Label value must be a string. |
| `<N/A>`<br/>`run.artifactReferences` | Object with artifact references to be attached to the current test run. Property name is the artifact reference name, property value is the artifact reference value. Value must be a string. |

#### Milestone

Zebrunner Milestone for the automation launch can be configured using the following configuration options (all of them are optional).

| Env var / Reporter config                       | Description                                                                                                                                                                                                                         |
|-------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `REPORTING_MILESTONE_ID`<br/>`milestone.id`     | Id of the Zebrunner Milestone to link the automation test run to. The id is not displayed on Zebrunner UI, so the field is basically used for internal purposes. If the milestone does not exist, the run will continue executing. |
| `REPORTING_MILESTONE_NAME`<br/>`milestone.name` | Name of the Zebrunner Milestone to link the automation test run to. If the milestone does not exist, the appropriate warning message will be displayed in logs, but the test suite will continue executing. |

#### Notifications

Zebrunner provides notification capabilities for automation launch results. The following options configure notification rules and targets.

| Env var / Reporter config | Description |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `REPORTING_NOTIFICATION_NOTIFY_ON_EACH_FAILURE`<br/>`notifications.notifyOnEachFailure` | Specifies whether Zebrunner should send notifications to Slack/Teams on each test failure. The notifications will be sent even if the test run is still running. The default value is `false`. |
| `REPORTING_NOTIFICATION_SLACK_CHANNELS`<br/>`notifications.slackChannels`               | A comma-separated list of Slack channels to send notifications to. Notifications will be sent only if the Slack integration is properly configured in Zebrunner with valid credentials for the project the launch is reported to. Zebrunner can send two types of notifications: on each test failure (if the appropriate property is enabled) and on the launch finish. |
| `REPORTING_NOTIFICATION_MS_TEAMS_CHANNELS`<br/>`notifications.teamsChannels`            | A comma-separated list of Microsoft Teams channels to send notifications to. Notifications will be sent only if the Teams integration is configured in the Zebrunner project with valid webhooks for the channels. Zebrunner can send two types of notifications: on each test failure (if the appropriate property is enabled) and on the launch finish.                |
| `REPORTING_NOTIFICATION_EMAILS`<br/>`notifications.emails`                              | A comma-separated list of emails to send notifications to. This type of notifications does not require further configuration on Zebrunner side. Unlike other notification mechanisms, Zebrunner can send emails only on the launch finish. |


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

| Env var / Reporter config                                                      | Description |
|--------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `REPORTING_TCM_ZEBRUNNER_PUSH_RESULTS`<br/>`tcm.zebrunner.pushResults`         | Boolean value which specifies if the execution results should be pushed to Zebrunner TCM. The default value is `false`. |
| `REPORTING_TCM_ZEBRUNNER_PUSH_IN_REAL_TIME`<br/>`tcm.zebrunner.pushInRealTime` | Boolean value. Specifies whether to push execution results immediately after each test is finished (value `true`) or not (value `false`). The default value is `false`. |
| `REPORTING_TCM_ZEBRUNNER_TEST_RUN_ID`<br/>`tcm.zebrunner.testRunId`            | Numeric id of the target Test Run in Zebrunner TCM. If a value is not provided, no new runs will be created.|

##### TestRail

| Env var / Reporter config                                                                      | Description |
|------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `REPORTING_TCM_TESTRAIL_PUSH_RESULTS`<br/>`tcm.testRail.pushResults`                           | Boolean value which specifies if the execution results should be pushed to TestRail. The default value is `false`. |
| `REPORTING_TCM_TESTRAIL_PUSH_IN_REAL_TIME`<br/>`tcm.testRail.pushInRealTime`                   | Boolean value. Specifies whether to push execution results immediately after each test is finished (value `true`) or not (value `false`). The default value is `false`. Enabling of this option forces the `includeAllTestCasesInNewRun` to be `true`. |
| `REPORTING_TCM_TESTRAIL_SUITE_ID`<br/>`tcm.testRail.suiteId`                                   | Specifies the numeric id of the TestRail Suite in which the tests reside. TestRail displays the ids prefixed with 'S' letter. You need to provide the id without this letter.                                                                          |
| `REPORTING_TCM_TESTRAIL_RUN_ID`<br/>`tcm.testRail.runId`                                       | The id of the TestRail Test Run in which the results should be pushed. TestRail displays the ids prefixed with 'R' letter. You need to provide the id without this letter.                                                                             |
| `REPORTING_TCM_TESTRAIL_RUN_NAME`<br/>`tcm.testRail.runName`                                   | Specifies the name of a new Test Run in TestRail. If push is enabled and run id is not provided, Zebrunner will create a new run in TestRail. If the value is not provided, Zebrunner will use the run display name.                                |
| `REPORTING_TCM_TESTRAIL_INCLUDE_ALL_IN_NEW_RUN`<br/>`tcm.testRail.includeAllTestCasesInNewRun` | If the value is set to `true`, all cases from the Suite will be added to the newly created Test Run. The value is forced to be `true` if real-time push is enabled. Default value is `false`.                                                          |
| `REPORTING_TCM_TESTRAIL_MILESTONE_NAME`<br/>`tcm.testRail.milestoneName`                       | The newly created Test Run will be associated with the milestone specified using this property. |
| `REPORTING_TCM_TESTRAIL_ASSIGNEE`<br/>`tcm.testRail.assignee`                                  | Assignee of the newly created Test Run. The value should be the email of an existing TestRail user. |

##### Xray

| Env var / Reporter config                                            | Description |
|----------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `REPORTING_TCM_XRAY_PUSH_RESULTS`<br/>`tcm.xray.pushResults`         | Boolean value which specifies if the execution results should be pushed to Xray. The default value is `false`.                                                          |
| `REPORTING_TCM_XRAY_PUSH_IN_REAL_TIME`<br/>`tcm.xray.pushInRealTime` | Boolean value. Specifies whether to push execution results immediately after each test is finished (value `true`) or not (value `false`). The default value is `false`. |
| `REPORTING_TCM_XRAY_EXECUTION_KEY`<br/>`tcm.xray.executionKey`       | The key of the Xray Execution where the results should be pushed. |

##### Zephyr

| Env var / Reporter config                                                | Description |
|--------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `REPORTING_TCM_ZEPHYR_PUSH_RESULTS`<br/>`tcm.zephyr.pushResults`         | Boolean value which specifies if the execution results should be pushed to Zephyr. The default value is `false`.                                                        |
| `REPORTING_TCM_ZEPHYR_PUSH_IN_REAL_TIME`<br/>`tcm.zephyr.pushInRealTime` | Boolean value. Specifies whether to push execution results immediately after each test is finished (value `true`) or not (value `false`). The default value is `false`. |
| `REPORTING_TCM_ZEPHYR_JIRA_PROJECT_KEY`<br/>`tcm.zephyr.jiraProjectKey`  | Specifies the key of the Jira project where the tests reside.                                                                                                           |
| `REPORTING_TCM_ZEPHYR_TEST_CYCLE_KEY`<br/>`tcm.zephyr.testCycleKey`      | The key of the Zephyr Test Cycle where the results should be pushed.                                                                                                    |

##### Custom Result Statuses

By default, when the execution results are being pushed to a TCM system, Zebrunner maps each test execution result to an appropriate result status in the target TCM system. Most of the time this work perfectly, but in some cases Zebrunner is not able to derive the appropriate target result status. 

One of the examples of such cases is when a test case result status does not correlate with the test execution status, or when you have conditional logic determining the actual result status for the test case. For such cases the Agent comes with a special method which sets a specific Result Status to the test case. For more information about this, see the [Linking test cases to test executions](#linking-test-cases-to-test-executions) section.

Another example is custom Result Statuses in target TCM system. In this case we cannot anticipate the correct status and simply skip the test execution. In order to tackle this, Zebrunner allows you to configure default status for passed and failed test executions (for skipped tests this is not technically possible).

| Env var / Reporter config                                                | Description |
|--------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| `REPORTING_TCM_TEST_CASE_STATUS_ON_PASS`<br/>`tcm.testCaseStatus.onPass` | The default status that will be assigned to passed test executions when they are pushed to a TCM system. |
| `REPORTING_TCM_TEST_CASE_STATUS_ON_FAIL`<br/>`tcm.testCaseStatus.onFail` | The default status that will be assigned to failed test executions when they are pushed to a TCM system. |

When pushing results to a TCM system, Zebrunner derives the Result Status in the following order:

1. Checks the explicitly assigned value (which was assigned using the `#testCaseStatus()` method).
2. Takes the default status provided via configuration for passed and/or failed tests.
3. Uses internal mapping of Zebrunner statuses to the Result Statuses of the target TCM system. 


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
    REPORTING_RUN_LOCALE=en_US
    REPORTING_RUN_TREAT_SKIPS_AS_FAILURES=true

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

## Configuration for Zebrunner Launcher
The Nightwatch Agent is fully integrated with the Zebrunner Launcher and requires even less configuration when used with it. The Zebrunner Launcher automatically provides REPORTING_ENABLED, REPORTING_PROJECT_KEY, REPORTING_SERVER_HOSTNAME, REPORTING_SERVER_ACCESS_TOKEN and some other environment variables, so there is no need to explicitly specify them or the corresponding `nightwatch.conf.js` file properties. 

### Testing Platform and capabilities
Moreover, the Zebrunner Agent will automatically substitute the Selenium server and capabilities configurations with the values selected in Testing Platform section in Zebrunner Launcher. For example, if you select Zebrunner Selenium Grid as a testing platform and select the Linux platform and the Chrome 105.0 browser, the Zebrunner Agent will apply the following configuration on your `nightwatch.conf.js` file. 

Only necessary to import `ZebrunnerConfigurator` and add a new environment that calls `ZebrunnerConfigurator.configureLauncher` function with basic config object of the following structure (please see below) into `nightwatch.conf.js` configuration file. 
Learn more about [Nightwatch environments](https://nightwatchjs.org/guide/configuration/define-test-environments.html).

When configuration below is added, you will be able to execute the tests against this environment using the command `npx nightwatch tests/ --env zebrunner` or `npm run test -- --env zebrunner` - depends on your `package.json` scripts section configuration.

*NOTE*: this environment can be used in 2 ways:
- using Zebrunner Launcher: in this case Zebrunner Agent will automatically substitute the Selenium server and capabilities according to provided information on Launchers page:
![Example of launcher configuration](./images/launcher_config.png).

- start running the tests locally, but using remote browsers with Zebrunner Selenium Grid: in this case you should provide valid Selenium information for host, port, username and access_key fields.


#### **`nightwatch.conf.js`**
   ```js
    const { ZebrunnerConfigurator } = require('@zebrunner/javascript-agent-nightwatch');

    module.exports = {

        // ...
        test_settings: {
            default: {
                screenshots: {
                    enabled: true,
                    path: 'screens',
                    on_failure: true,
                    on_error: true,
                },
            },

            // `zebrunner` environment should be defined on the same level as `default` environment
            zebrunner: ZebrunnerConfigurator.configureLauncher({
                selenium: {
                    start_process: false,
                    server_path: '',
                    host: 'localhost',
                    port: 4444,
                },

                username: 'username',
                access_key: 'access_key',

                webdriver: {
                    start_process: false,
                },
                desiredCapabilities: {
                    browserName: 'chrome',
                    'goog:chromeOptions': {
                        w3c: true,
                    },
                    "zebrunner:provider": "BROWSERSTACK"
                },
            }),
            // ...
        },
    };
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

## Attaching labels to test and test run

In some cases, it may be useful to attach meta information related to a test or the entire run.

The agent comes with a concept of labels. Label is a simple key-value pair. The label key is represented by a string, the label value accepts a vararg of strings.

To attach a label to a test, you need to invoke the `#attachLabel()` method of the `CurrentTest` object in scope of the test method. Also you can use this method in `beforeEach()` that means such labels will be assigned for all test cases from the file.
To attach label to the entire run, you can either invoke the `attachLabel` method of the `CurrentTestRun` object or provide the labels in [`nightwatch.conf.js` file](#automation-launch-configuration).


```js
    const { CurrentTestRun, CurrentTest } = require("@zebrunner/javascript-agent-nightwatch");

    module.exports = {

        beforeEach(browser) {
            CurrentTestRun.attachLabel('run_label', 'first', 'second');

            ZebrunnerReporterAPI.startTest(browser);

            CurrentTest.attachLabel(browser, 'test_label', 'before_1', 'before_2');
        },

        afterEach(browser) {
            ZebrunnerReporterAPI.finishTest(browser);
        },

        'first test': (browser) => {
            CurrentTestRun.attachLabel('feature', 'smoke');

            CurrentTest.attachLabel(browser, 'test', 'pass');
            CurrentTest.attachLabel(browser, 'owner', 'developer');
            // ...
        },
    };
```

## Attaching artifact references to test and test run

Labels are not the only option for attaching meta information to test and test run. If the information you want to attach is a link (to a file or webpage), it is more useful to attach it as an artifact reference (or to put it simply as a link).

The `#attachArtifactReference()` methods of the `CurrentTest` and `CurrentTestRun` objects serve exactly this purpose. These methods accept two arguments. The first one is the artifact reference name which will be shown in Zebrunner. The second one is the artifact reference value.
Also you can use `CurrentTest.attachArtifactReference()` in `beforeEach()` hook that means a reference will be assigned for all test cases from the file.

Moreover, you can attach artifact references to the entire test run by specifying them in [`nightwatch.conf.js` file](#automation-launch-configuration).

```js
    const { CurrentTestRun, CurrentTest } = require("@zebrunner/javascript-agent-nightwatch");

    module.exports = {

        beforeEach(browser) {
            CurrentTestRun.attachArtifactReference('documentation', 'https://zebrunner.com/documentation/');

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

## Attaching artifacts to test and test run

In case your tests or entire test run produce some artifacts, it may be useful to track them in Zebrunner. The agent comes with a few convenient methods for uploading artifacts in Zebrunner and linking them to the currently running test or the test run.

The `#uploadArtifactBuffer()` and `#uploadArtifactFromFile()` methods of the `CurrentTest` and `CurrentTestRun` objects serve exactly this purpose. 
Also you can use methods mentioned above from `CurrentTest` in `beforeEach()` hook that means an artifact will be assigned for all test cases from the file.

```js
    const { CurrentTestRun, CurrentTest } = require("@zebrunner/javascript-agent-nightwatch");
    const fs = require('fs');

    module.exports = {

        beforeEach(browser) {
            CurrentTestRun.uploadArtifactFromFile("configuration", "./images/launcher_config.png");

            const buffer = fs.readFileSync("./screens/fileName.png")
            CurrentTestRun.uploadArtifactBuffer('artifact_image_name', 'image/png', buffer);

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

Zebrunner Agent comes with a convenient method `#revertRegistration()` of the `CurrentTest` object for reverting test registration at runtime. The following code snippet shows a case where test is not reported on Monday.

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

It is worth mentioning that the method invocation does not affect the test execution, but simply unregisters the test in Zebrunner. To interrupt the test execution, you need to do additional actions, for example, throw an Error.

## Linking test cases to test executions

Note: to learn more about pushing results to a TCM system, see the [Integration with Test Case Management systems](#integration-with-test-case-management-systems) section.

### Zebrunner TCM

The Agent comes with the `Zebrunner` object which contains methods to link test cases to a currently executing test: 

- `#testCaseKey(browser, ...testCaseKeys)` - accepts a list of test cases which should be linked to the current test;
- `#testCaseStatus(browser, testCaseKey, resultStatus)` - links one test case and provides\overrides its result status. This may be useful if the test case result status does not correlate with the test execution status, or if you have conditional logic determining the actual result status for the test case.

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

### Testrail

The Agent comes with the `TestRail` object which contains methods to link test cases to a currently executing test: 

- `#testCaseId(browser, ...testCaseIds)` - accepts a list of test cases which should be linked to current test;
- `#testCaseStatus(browser, testCaseId, resultStatus)` - links one test case and provides\overrides its result status. This may be useful if the test case result status does not correlate with the test execution status, or if you have conditional logic determining the actual result status for the test case.

If these methods are invoked for the same test case id many times within a test method, the last invocation will take precedence. For example, if you invoke the `#testCaseStatus(browser, 'C1', 'SKIPPED')` first and then invoke the `#testCaseId(browser, 'C1')`, then the result status you provided in first invocation will be ignored.

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

- `#testCaseKey(browser, ...testCaseKeys)` - accepts a list of test cases which should be linked to current test;
- `#testCaseStatus(browser, testCaseKey, resultStatus)` - links one test case and provides\overrides its result status. This may be useful if the test case result status does not correlate with the test execution status, or if you have conditional logic determining the actual result status for the test case.

If these methods are invoked for the same test case id many times within a test method, the last invocation will take precedence. For example, if you invoke the `#testCaseStatus(browser, 'KEY-1', 'SKIPPED')` first, and then invoke the `#testCaseKey(browser, 'KEY-1')`, then the result status you provided in first invocation will be ignored.

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

The Agent comes with the `Zephyr` object which contains methods to link test cases to currently executing test:

- `#testCaseKey(browser, ...testCaseKeys)` - accepts a list of test cases which should be linked to current test;
- `#testCaseStatus(browser, testCaseKey, resultStatus)` - links one test case and provides\overrides its result status. This may be useful if the test case result status does not correlate with the test execution status, or if you have conditional logic determining the actual result status for the test case.

If these methods are invoked for the same test case id many times within a test method, the last invocation will take precedence. For example, if you invoke the `#testCaseStatus(browser, 'KEY-1', 'SKIPPED')` first, and then invoke the `#testCaseKey(browser, 'KEY-1')`, then the result status you provided in first invocation will be ignored.

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
