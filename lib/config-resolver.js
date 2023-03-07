const getValueByPath = (object, path) => path.split('.').reduce((o, k) => o?.[k], object);

const DEFAULT_PROJECT_KEY = 'DEF';
const DEFAULT_TEST_RUN_NAME = 'Default Suite';

class ConfigResolver {
  constructor(reporterConfig) {
    this.reporterConfig = reporterConfig;
  }

  getConfig(envVarName, configName, defaultValue) {
    if (envVarName && process.env[envVarName]) {
      // console.log(`Env variable ${envVarName} has value = ${process.env[envVarName]}`);

      return process.env[envVarName];
    }
    const configValue = configName ? getValueByPath(this.reporterConfig.reporterOptions.zebrunnerConfig, configName) : null;

    // configValue value can be either undefined | null | true | false | 'string' so explicitly checking that not undefined and not null
    if (configValue !== undefined && configValue !== null) {
      // console.log(`Config name ${configName} has value ${configValue}`);

      return configValue;
    }

    return defaultValue;
  }

  isReportingEnabled() {
    if (
      this.getReportingEnabled() === true
      && (!this.getReportingServerHostname() || !this.getReportingServerAccessToken())
    ) {
      throw new Error(
        'When reporting is enabled, you must provide Zebrunner hostname and accessToken',
      );
    }

    return this.getReportingEnabled();
  }

  getReportingEnabled() {
    return String(this.getConfig('REPORTING_ENABLED', 'enabled')).toLowerCase() === 'true';
  }

  getReportingServerHostname() {
    return this.getConfig('REPORTING_SERVER_HOSTNAME', 'server.hostname');
  }

  getReportingServerAccessToken() {
    return this.getConfig('REPORTING_SERVER_ACCESS_TOKEN', 'server.accessToken');
  }

  getReportingProjectKey() {
    return this.getConfig('REPORTING_PROJECT_KEY', 'projectKey', DEFAULT_PROJECT_KEY);
  }

  getReportingRunDisplayName() {
    return this.getConfig('REPORTING_RUN_DISPLAY_NAME', 'run.displayName', DEFAULT_TEST_RUN_NAME);
  }

  getReportingRunBuild() {
    return this.getConfig('REPORTING_RUN_BUILD', 'run.build');
  }

  getReportingRunEnvironment() {
    return this.getConfig('REPORTING_RUN_ENVIRONMENT', 'run.environment');
  }

  getReportingRunLocale() {
    return this.getConfig('REPORTING_RUN_LOCALE', 'run.locale');
  }

  getReportingTreatSkipsAsFailures() {
    return this.getConfig('REPORTING_RUN_TREAT_SKIPS_AS_FAILURES', 'run.treatSkipsAsFailures', true);
  }

  getReportingRunLabels() {
    const labels = this.getConfig(null, 'run.labels') || {};

    return Object.keys(labels).filter((key) => key && key.trim()).map((key) => ({ key, value: labels[key] }));
  }

  getReportingRunArtifactReferences() {
    const artifactReferences = this.getConfig(null, 'run.artifactReferences') || {};

    return Object.keys(artifactReferences)
      .filter((name) => name && name.trim()).map((name) => ({ name, value: artifactReferences[name] }));
  }

  getReportingRunContext() {
    return this.getConfig('REPORTING_RUN_CONTEXT', null);
  }

  getReportingMilestoneId() {
    return this.getConfig('REPORTING_MILESTONE_ID', 'milestone.id');
  }

  getReportingMilestoneName() {
    return this.getConfig('REPORTING_MILESTONE_NAME', 'milestone.name');
  }

  getReportingNotificationOnEachFailure() {
    return this.getConfig('REPORTING_NOTIFICATION_NOTIFY_ON_EACH_FAILURE', 'notifications.notifyOnEachFailure', false);
  }

  getReportingNotificationSlackChannels() {
    return this.getConfig('REPORTING_NOTIFICATION_SLACK_CHANNELS', 'notifications.slackChannels');
  }

  getReportingNotificationMsTeamsChannels() {
    return this.getConfig('REPORTING_NOTIFICATION_MS_TEAMS_CHANNELS', 'notifications.teamsChannels');
  }

  getReportingNotificationEmails() {
    return this.getConfig('REPORTING_NOTIFICATION_EMAILS', 'notifications.emails');
  }

  getReportingTcmTestCaseStatusOnPass() {
    return this.getConfig('REPORTING_TCM_TEST_CASE_STATUS_ON_PASS', 'tcm.testCaseStatus.onPass');
  }

  getReportingTcmTestCaseStatusOnFail() {
    return this.getConfig('REPORTING_TCM_TEST_CASE_STATUS_ON_FAIL', 'tcm.testCaseStatus.onFail');
  }

  getReportingTcmZebrunner() {
    return {
      pushResults: this.getConfig('REPORTING_TCM_ZEBRUNNER_PUSH_RESULTS', 'tcm.zebrunner.pushResults'),
      pushInRealTime: this.getConfig('REPORTING_TCM_ZEBRUNNER_PUSH_IN_REAL_TIME', 'tcm.zebrunner.pushInRealTime'),
      testRunId: this.getConfig('REPORTING_TCM_ZEBRUNNER_TEST_RUN_ID', 'tcm.zebrunner.testRunId'),
    };
  }

  getReportingTcmTestRail() {
    return {
      pushResults: this.getConfig('REPORTING_TCM_TESTRAIL_PUSH_RESULTS', 'tcm.testRail.pushResults'),
      pushInRealTime: this.getConfig('REPORTING_TCM_TESTRAIL_PUSH_IN_REAL_TIME', 'tcm.testRail.pushInRealTime'),
      suiteId: this.getConfig('REPORTING_TCM_TESTRAIL_SUITE_ID', 'tcm.testRail.suiteId'),
      runId: this.getConfig('REPORTING_TCM_TESTRAIL_RUN_ID', 'tcm.testRail.runId'),
      includeAllTestCasesInNewRun: this.getConfig('REPORTING_TCM_TESTRAIL_INCLUDE_ALL_IN_NEW_RUN', 'tcm.testRail.includeAllTestCasesInNewRun'),
      runName: this.getConfig('REPORTING_TCM_TESTRAIL_RUN_NAME', 'tcm.testRail.runName'),
      milestoneName: this.getConfig('REPORTING_TCM_TESTRAIL_MILESTONE_NAME', 'tcm.testRail.milestoneName'),
      assignee: this.getConfig('REPORTING_TCM_TESTRAIL_ASSIGNEE', 'tcm.testRail.assignee'),
    };
  }

  getReportingTcmXray() {
    return {
      pushResults: this.getConfig('REPORTING_TCM_XRAY_PUSH_RESULTS', 'tcm.xray.pushResults'),
      pushInRealTime: this.getConfig('REPORTING_TCM_XRAY_PUSH_IN_REAL_TIME', 'tcm.xray.pushInRealTime'),
      executionKey: this.getConfig('REPORTING_TCM_XRAY_EXECUTION_KEY', 'tcm.xray.executionKey'),
    };
  }

  getReportingTcmZephyr() {
    return {
      pushResults: this.getConfig('REPORTING_TCM_ZEPHYR_PUSH_RESULTS', 'tcm.zephyr.pushResults'),
      pushInRealTime: this.getConfig('REPORTING_TCM_ZEPHYR_PUSH_IN_REAL_TIME', 'tcm.zephyr.pushInRealTime'),
      jiraProjectKey: this.getConfig('REPORTING_TCM_ZEPHYR_JIRA_PROJECT_KEY', 'tcm.zephyr.jiraProjectKey'),
      testCycleKey: this.getConfig('REPORTING_TCM_ZEPHYR_TEST_CYCLE_KEY', 'tcm.zephyr.testCycleKey'),
    };
  }
}

module.exports = ConfigResolver;
