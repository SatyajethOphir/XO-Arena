const games = new Map();

module.exports = {
  create(channelId, game) {
    games.set(channelId, game);
  },

  get(channelId) {
    return games.get(channelId);
  },

  delete(channelId) {
    games.delete(channelId);
  }
};