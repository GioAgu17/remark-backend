const stage = process.env.stage;

const stageConfigs = {
  dev: {
    accessKeyId: "/accessKeyId/dev",
    accessSecretKeyId: "/accessSecretKey/dev"
  },
  prod: {
    accessKeyId: "/accessKeyId/prod",
    accessSecretKeyId: "/accessSecretKey/prod"
  }
};

const config = stageConfigs[stage] || stageConfigs.dev;

export default {
  stage,
  ...config
};