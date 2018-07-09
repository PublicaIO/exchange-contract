<template>
  <div id="header-template" class="sticky header">
    <div class="content">
      <router-link to="/" class="logo">PoC</router-link>
      <div class="links">
        <router-link to="/dashboard" class="link1">Dashboard</router-link> <span class="divider"></span>
        <router-link to="/balance" class="link1">Balance</router-link> <span class="divider"></span>
        <router-link to="/books" class="link1">Books</router-link> <span class="divider"></span>
      </div>
    </div>
  </div>
</template>

<script type="text/javascript">
  export default {
    name: 'header-template',
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
  #header-template {
    width: 100%;
  }

  .sticky {
    position: fixed;
    padding: 5px 20px;
    top: 0px;
    height: 70px;
    background: #bababa;
    width: 100%;
    box-sizing: border-box;
    z-index: 666;
  }

  .content {
    height: 60px;
    line-height: 60px;
  }

  .logo {
    float: left;
    width: 250px;
    height: 36px;
    background-size: contain;
    margin: 15px 0px;
    text-decoration: none;
    color: #4d4c49;
  }

  .links {
    float: right;
    height: 60px;
  }

  .divider {
    display: none;
  }

  .links:before {
    display: none;
  }

  .links:hover a {
    display: inline-block;
  }

  .links a:hover {
    background: transparent;
    color: #4c4e49;
  }

  .links a {
    display: inline-block;
    width: auto;
    margin-top: 5px;
    color: #4c4e49;
    border: none;
    position: relative;
    top: 0px;
    background: transparent;
    right: 0px;
  }

  .divider {
    color: #4c4e49;
    display: inline-block;
  }

  .divider:before {
    content: "|";
  }

</style>
