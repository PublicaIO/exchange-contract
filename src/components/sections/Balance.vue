<template>
  <div id="gimme-pbl">
    <div class="content">
        <div>
          <div><span>ETH:</span> <span>{{ eth }}</span></div>
          <div><span>PBL:</span> <span>{{ pbl }}</span> (Exchange allowance: <span>{{ allowance }}</span>)</div>
          <div>Exchange address: {{ exchangeContractAddress }}</div>
          <div>Exchange configured pebbles address: {{ exchangePblAddress }}</div>
          <div>Pebbles address: {{ pblContractAddress }}</div>
        </div>
        <GimmePBLForm @funded="onFunded"/>
    </div>
  </div>
</template>

<script>
  export default {
    data: function () {
      return {
        user: this.$store.state.user,
        eth: 0,
        pbl: 0,
        allowance: 0
      }
    },
    components: {
      GimmePBLForm
    },
    computed: {
      exchangeContractAddress () {
        return this.$store.getters.exchange.address
      },
      pblContractAddress () {
        return this.$store.getters.pebbles.address
      }
    },
    asyncComputed: {
      exchangePblAddress () {
        return this.$store.getters.exchange.callMethod('pebbles')
      },
      eth () {
        return this.$store.getters.eth
      },
      pbl () {
        const coinbase = this.$store.state.user.coinbase

        return this.$store.getters.pebbles.balanceOf(coinbase)
      },
      allowance () {
        const coinbase = this.$store.state.user.coinbase
        const exchange = this.$store.getters.exchange

        return this.$store.getters.pebbles.allowance(coinbase, exchange.address)
      }
    },
    methods: {
      onFunded (balance, allowance) {
        this.pbl = balance
        this.allowance = allowance
      }
    },
    name: 'balance'
  }

  import GimmePBLForm from './GimmePBLForm'

</script>

<style scoped>

.content {
  height: 100%;
  text-align: center;
  margin: auto;
  line-height: 40px;
  padding: 100px;
}

</style>
