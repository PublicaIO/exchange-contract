<template>
  <div id="order-list">
    <NewOrderForm :address="address" :direction="direction" @created="onOrderCreated" />
    <br/>
    <table>
      <tr>
        <th>Id</th>
        <th>Owner</th>
        <th>Price</th>
        <th>Amount</th>
        <th>Actions</th>
      </tr>
      <tr v-for="order in orders">
        <td class="address">{{ order.id }}</td>
        <td class="address">{{ order.owner }}</td>
        <td class="price">{{ order.price }}</td>
        <td class="amount">{{ order.amount }}</td>
        <td>
            <button v-on:click="cancelOrder(order.id)" v-if="order.owner == currentUser">Cancel</button>
            <button :click="acceptOrder" v-if="order.owner != currentUser">Accept</button>
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
  export default {
    data: function () {
      return {
        orders: [],
        refreshOrders: 0
      }
    },
    props: ['address', 'direction'],
    methods: {
      onOrderCreated () {
        this.refreshOrders = this.refreshOrders + 1
        this.$emit('created')
      },
      cancelOrder (id) {
        const state = this.$store.state
        const coinbase = state.user.coinbase

        this.$store.getters.exchange.cancelOrder(this.direction, this.address, id, coinbase)
          .then(() => {
            this.refreshOrders = this.refreshOrders + 1
            this.$emit('deleted')
          })
      }
    },
    asyncComputed: {
      orders: {
        get () {
          return this.$store.getters.exchange.getOrders(this.direction, this.address)
        },
        watch () {
          return this.refreshOrders
        }
      }
    },
    computed: {
      currentUser () {
        return this.$store.state.user.coinbase
      }
    },
    components: {
      NewOrderForm
    },
    name: 'order-list'
  }

  import NewOrderForm from './NewOrderForm'

</script>

<style scoped>
#order-list {
  width: 100%;
}

table, th, td {
  margin: auto;
  border: 1px solid black;
  padding: 2px;
}
</style>
