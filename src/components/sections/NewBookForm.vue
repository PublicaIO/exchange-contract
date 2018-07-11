<template>
  <div id="book-form">
    <h3>Create and Register book</h3>
    <div class="wrapper">
      <div class="column">
        <div class="row">
          <label for="title">Title</label>
          <input type="text" id="title" name="title" v-model="title">
        </div>
        <div class="row">
          <label for="commission">Author commission permille</label>
          <input type="text" id="commission" name="commission" v-model="commission">
        </div>
        <div class="row">
          <label for="address">Author address</label>
          <input type="text" id="address" name="address" v-model="address">
        </div>
        <div class="row">
          <label class="warning-label">Please fill all fields.</label>
          <input type="button" value="Submit" @click="submit">
        </div>
      </div>
    </div>
  </div>
</template>

<script type="text/javascript">
  export default {
    data: function () {
      return {
        title: '',
        commission: 0,
        address: '0x0'
      }
    },
    methods: {
      submit (evt) {
        let state = this.$store.state
        let coinbase = this.$store.state.user.coinbase

        let book = new Book(state.web3.instance(), 0, this.$store.getters.exchange.address)
        book.deploy(coinbase).then(instance => {
          console.log(coinbase)
          console.log(instance.address, this.title, this.commission, this.address)
          this.$store.getters.exchange.registerToken(instance.address, this.title, this.commission, this.address).then(() => {
            console.log('Book registered')
            this.$emit('registered')
          })
        })
      }
    },
    name: 'new-book-form'
  }

  import Book from '../../util/book'
</script>

<style scoped>
  #book-form {
    max-width: 620px;
    position: relative;
    border: 4px;
    border-style: solid;
    border-color: black;
    margin: auto;
  }

  h3 {
    text-align: center;
    margin-bottom: 20px;
  }

  .wrapper {
    width: 460px;
    margin: auto;
  }

  .column {
    display: inline-block;
  }

  .row {
    margin-top: 20px;
    font-size: 14px;
    height: 40px;
    display: block;
  }

  label {
    height: 100%;
    line-height: 40px;
    width: 200px;
    display: inline-block;
  }

  .warning-label {
    display: none;
    width: 140px;
    height: 20px;
    line-height: 20px;
    color: #ba3333;
  }

  input[type=text] {
    height: 30px;
    line-height: 30px;
    width: 200px;
    display: inline-block;
    color: #4d4c49;
    outline: none;
  }

  input {
    height: 30px;
    line-height: 30px;
    width: 100px;
    float: right;
  }
</style>
