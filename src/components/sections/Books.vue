<template>
  <div id="books">
    <div class="content">
      <NewBookForm @registered="refreshBooks++"/>
      <div class="registered">
        <h3>Registered books:</h3>
        <table>
          <tr>
            <th>Address</th>
            <th>Title</th>
            <th>Actions</th>
          </tr>
          <tr v-for="book in books">
            <td class="address">{{ book.address }}</td>
            <td class="title">{{ book.title }}</td>
            <td>
              <router-link :to="{ name: 'Orders', params: { address: book.address }}">Orders</router-link>
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    data: function () {
      return {
        books: [],
        refreshBooks: 0
      }
    },
    asyncComputed: {
      books: {
        get () {
          const exchange = this.$store.getters.exchange
          return exchange.getRegisteredBooks()
        },
        watch () {
          return this.refreshBooks
        }
      }
    },
    components: {
      NewBookForm
    },
    name: 'books'
  }

  import NewBookForm from './NewBookForm'
  // import all from 'promise-all-map'

</script>

<style scoped>

.content {
  height: 100%;
  margin: auto;
  padding: 100px;
}

.registered {
  padding-top: 20px;
}

h3 {
  text-align: center;
}

.title {
  font-weight: bold;
}

.address {
  font-family: Courier
}

table, th, td {
  margin: auto;
  border: 0px solid black;
  padding: 5px;
}
</style>
