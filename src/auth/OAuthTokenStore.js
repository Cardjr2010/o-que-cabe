export class OAuthTokenStore {
  isConfigured() {
    return false;
  }

  async get(_provider, _accountId = "default") {
    return null;
  }

  async save(_provider, _accountId = "default", _tokenData = {}) {
    return false;
  }

  async replaceAtomically(_provider, _accountId = "default", _expectedRefreshToken = "", _tokenData = {}) {
    return false;
  }

  async delete(_provider, _accountId = "default") {
    return false;
  }

  async saveState(_provider, _state, _data = {}, _ttlSeconds = 900) {
    return false;
  }

  async consumeState(_provider, _state) {
    return null;
  }
}

export default OAuthTokenStore;
