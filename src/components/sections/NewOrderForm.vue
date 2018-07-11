<template>
  <div id="token-form">
    <h3>Create order</h3>
    <div class="wrapper">
      <div class="column">
        <div class="row">
          <label for="value">Amount</label>
          <input type="text" id="amount" name="amount" v-model="amount">
        </div>
        <div class="row">
          <label for="price">Price (in PBL)</label>
          <input type="text" id="price" name="price" v-model="price">
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
    props: ['address', 'direction'],
    data: function () {
      return {
        amount: 1,
        price: 0
      }
    },
    methods: {
      submit (evt) {
        this.$store.getters.exchange.placeOrder(this.direction, this.address, this.amount, this.price)
          .then(() => {
            this.$emit('created')
          })
      }
    },
    name: 'order-form'
  }
</script>

<style scoped>
  #token-form {
    margin: auto;
    width: 620px;
    position: relative;
    padding: 10px;
    border: 4px;
    border-style: solid;
    border-color: black;
  }

  h3 {
    text-align: center;
    margin-bottom: 10px;
  }

  .column {
    width: 300px;
    display: inline-block;
  }

  .row {
    margin-top: 20px;
    font-size: 14px;
    width: 300px;
    height: 40px;
    display: block;
  }

  label {
    height: 100%;
    line-height: 40px;
    width: 100px;
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
