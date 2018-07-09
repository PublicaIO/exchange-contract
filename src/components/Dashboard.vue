<template>
  <div id="dashboard">
    <HeaderTemplate />
    <BodyTemplate
      :current-view="currentView"
    />
  </div>
</template>

<script>
  export default {
    data: function () {
      return {
        user: this.$store.state.user
      }
    },
    name: 'dashboard',
    props: [ 'currentView' ],
    components: {
      HeaderTemplate,
      BodyTemplate
    }
  }

  import HeaderTemplate from './layout/HeaderTemplate'
  import BodyTemplate from './layout/BodyTemplate'
</script>

<style scoped>
  #dashboard {
    width: 100%;
  }
</style>
