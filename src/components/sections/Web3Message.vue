<template>
  <div id="web3-message">
    <div class="content">
      <div class="message">
        <div v-if="user.hasWeb3InjectedBrowser">
          Your browser is Web3-injected.
          <br>
          <div>
            <div v-if="user.hasCoinbase">
              <span>
                And we can see your ethereum address [{{ coinbase }}].
              </span>
            </div>
            <div v-else>
              But it seems you don't have an account with us on the blockchain.<br>Or you do but the account is currently inaccessible.<br>Create an account on the blockchain and sign up to begin, or make your existing account accessible.
            </div>
          </div>
        </div>
        <div v-else>
          {{  user.warningMessage }} To use the eth-vue dApp, you can begin by installing a Web3 injector like <a href='https://metamask.io/'>Metamask</a>.
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'web3-message',
    computed: {
      coinbase () {
        return this.user.coinbase
      }
    },
    data: function () {
      return {
        user: this.$store.state.user
      }
    },
    methods: {
    }
  }
</script>

<style scoped>
  #web3-message {
    width: 100%;
    height: 420px;
  }

  .blockchain-message {
    float: left;
    margin-top: 20px;
    font-size: 14px;
    border: 1px solid #dcdede;
    color: #4d4c49;
    width: auto;
    padding: 10px;
  }

  .content {
    height: 100%;
    text-align: center;
    max-width: 920px;
    margin: auto;
    padding: 160px;
  }

  .message {
    height: 80px;
    line-height: 40px;
  }

</style>
