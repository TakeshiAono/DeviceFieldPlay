module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native|@aws-sdk|@smithy|uuid|@rneui/themed|@rneui/base|@react-native|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|@sentry/.*)",
  ],
  testPathIgnorePatterns: ["/lambda/"],
};
