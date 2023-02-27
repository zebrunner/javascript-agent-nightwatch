const getValueByPath = (object, path) => path.split('.').reduce((o, k) => o?.[k], object);

const DEFAULT_PROJECT_KEY = 'DEF';
const DEFAULT_TEST_RUN_NAME = 'Default Suite';

class ConfigResolver {
  constructor(reporterConfig) {
    this.reporterConfig = reporterConfig;
  }

  getConfig(envVarName, configName, defaultValue) {
    if (envVarName && process.env[envVarName]) {
      console.log(`Env variable ${envVarName} has value = ${process.env[envVarName]}`);

      return process.env[envVarName];
    }
    const configValue = configName ? getValueByPath(this.reporterConfig.reporterOptions.zebrunnerConfig, configName) : null;

    if (configValue) {
      console.log(`Config name ${configName} has value ${configValue}`);

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
}

module.exports = ConfigResolver;
