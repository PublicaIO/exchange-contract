<template>
  <div id="pbl-form">
    <h3>Gimme PBLS</h3>
    <div class="wrapper">
      <div class="column">
        <div class="row">
          <label for="value">Value</label>
          <input type="text" id="value" name="value" v-model="value">
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
        value: 1
      }
    },
    methods: {
      submit (evt) {
        let coinbase = this.$store.state.user.coinbase

        const requested = parseInt(this.value)
        this.$store.getters.pebbles.gimmeAndApprove(coinbase, requested)
          .then(balance => {
            this.$emit('funded')

            this.$store.getters.exchange.depositPbl(balance).then(() => {
              this.$emit('funded')
            })
          })
      }
    },
    name: 'pbl-form'
  }

</script>

<style scoped>
  #pbl-form {
    width: 100%;
    position: relative;
    padding: 10px;
    border: 4px;
    border-style: solid;
    border-color: black;
    max-width: 620px;
    margin: auto;
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
