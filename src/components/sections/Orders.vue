<template>
  <div id="orders">
    <div class="content">
      <div>
        Book contract: {{ address }} <br/>
        Your balance: {{ bookTokens }} <br/>
        Exchange allowance: {{ bookAllowance }} <br/>
        <GimmeBookForm v-bind:address="address" @funded="refreshExchange++"/>
        <h2>Exchange:</h2>
        Balance PBL: {{ exchangeBalancePbls }} |
        Locked PBL: {{ exchangeLockedPbls }} |
        Balance token: {{ exchangeBookTokens }} |
        Locked token: {{ exchangeLockedBookTokens }} <br/>
        <h3>Buy orders</h3>
        <OrderList v-bind:address="address" :direction="'Buy'" @created="refreshExchange++" @deleted="refreshExchange++"/>
        <h3>Sell orders</h3>
        <OrderList v-bind:address="address" :direction="'Sell'" @created="refreshExchange++" @deleted="refreshExchange++"/>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    data: function () {
      return {
        address: this.$route.params.address,
        bookTokens: 0,
        bookAllowance: 0,
        exchangeBalancePbls: 0,
        exchangeLockedPbls: 0,
        exchangeBookTokens: 0,
        exchangeLockedBookTokens: 0,

        refreshExchange: 0
      }
    },
    asyncComputed: {
      exchangeBalancePbls: {
        get () {
          return this.$store.getters.exchange.callNumericMethod('pblBalanceOf', this.$store.state.user.coinbase)
        },
        watch () {
          return this.refreshExchange
        }
      },
      exchangeLockedPbls: {
        get () {
          return this.$store.getters.exchange.callNumericMethod('pblLockedOf', this.$store.state.user.coinbase)
        },
        watch () {
          return this.refreshExchange
        }
      },
      exchangeBookTokens: {
        get () {
          return this.$store.getters.exchange.callNumericMethod('tokenBalanceOf', this.address, this.$store.state.user.coinbase)
        },
        watch () {
          return this.refreshExchange
        }
      },
      exchangeLockedBookTokens: {
        get () {
          return this.$store.getters.exchange.callNumericMethod('tokenLockedOf', this.address, this.$store.state.user.coinbase)
        },
        watch () {
          return this.refreshExchange
        }
      },
      bookTokens: {
        get () {
          const state = this.$store.state
          const web3 = state.web3.instance()
          const coinbase = state.user.coinbase

          let book = new Book(web3, this.address, this.$store.getters.exchange.address)

          return book.balanceOf(coinbase)
        },
        watch () {
          return this.refreshExchange
        }
      },
      bookAllowance: {
        get () {
          const state = this.$store.state
          const web3 = state.web3.instance()
          const coinbase = state.user.coinbase

          let book = new Book(web3, this.address, this.$store.getters.exchange.address)

          return book.allowance(coinbase, this.$store.getters.exchange.address)
        },
        watch () {
          return this.refreshExchange
        }
      }
    },
    components: {
      OrderList,
      GimmeBookForm
    },
    name: 'orders'
  }

  import OrderList from './OrderList'
  import GimmeBookForm from './GimmeBookForm'
  import Book from '../../util/book'
</script>

<style scoped>
#orders {
  width: 100%;
}

.content {
  height: 100%;
  text-align: center;
  max-width: 920px;
  margin: auto;
  padding: 100px;
  line-height: 40px;
}

</style>
