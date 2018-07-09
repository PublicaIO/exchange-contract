import Vue from 'vue'
import App from './components/App.vue'
import router from './router'
import store from './store'
import AsyncComputed from 'vue-async-computed'

Vue.use(AsyncComputed)

import { mapState, mapActions } from 'vuex'
import { ACTION_TYPES } from './util/constants'
import monitorWeb3 from './util/web3/monitorWeb3'

Vue.config.devtools = true
Vue.config.productionTip = false

/* eslint-disable no-new */

new Vue({
  el: '#app',
  router,
  store,
  template: '<App :is-d-app-ready="isDAppReady" :current-view="currentView" />',
  components: { App },
  beforeCreate: function () {
    this.$store.dispatch(ACTION_TYPES.REGISTER_WEB3_INSTANCE)
      .then((result) => {
        let state = result.state
        monitorWeb3(state)

        this.$store.dispatch(ACTION_TYPES.UPDATE_USER_BLOCKCHAIN_STATUS)
          .then(() => {
            if (!(this.isDAppReady)) {
              this.$store.dispatch(ACTION_TYPES.UPDATE_DAPP_READINESS, true)
            }
          })
          .catch((e) => {
            console.log('Unable to UPDATE_USER_BLOCKCHAIN_STATUS')
            if (!(this.isDAppReady)) {
              this.$store.dispatch(ACTION_TYPES.UPDATE_DAPP_READINESS, true)
            }
          })
      })
      .catch((result = {}) => {
        let state = result.state
        monitorWeb3(state)
        if (!(this.isDAppReady)) {
          this.$store.dispatch(ACTION_TYPES.UPDATE_DAPP_READINESS, true)
        }

        console.error(result, 'Unable to REGISTER_WEB3_INSTANCE')
      })
  },
  computed: {
    ...mapState({
      hasInjectedWeb3: state => state.web3.isInjected,
      hasWeb3InjectedBrowser: state => state.user.hasWeb3InjectedBrowser,
      hasCoinbase: state => state.user.hasCoinbase,
      networkId: state => state.web3.networkId,
      coinbase: state => state.web3.coinbase,
      currentRoute: state => state.currentRoute,
      currentView: state => state.currentView,
      user: state => state.user,
      isDAppReady: state => state.isDAppReady,
      defaultRoute: state => state.defaultRoute
    })
  },
  created: function () {
    this[ACTION_TYPES.CHANGE_CURRENT_ROUTE_TO](this.$route)
    this[ACTION_TYPES.SET_CURRENT_VIEW](this.$route)
  },
  data: function () {
    return {
      managers: {
      }
    }
  },
  methods: {
    ...mapActions([
      ACTION_TYPES.CHANGE_CURRENT_ROUTE_TO,
      // ACTION_TYPES.SET_IS_VALID_USER_BUT,
      // ACTION_TYPES.RESET_IS_VALID_USER_BUT,
      ACTION_TYPES.SET_CURRENT_VIEW
    ])

    // callToAccessBlockchain (payload = null) {
    //   const actionParams = Object.assign({}, payload.requestParams, {
    //     methodName: payload.methodName,
    //     contractIndexToUse: payload.contractIndexToUse
    //   })
    //   const value = payload.value
    //   this.managers[payload.managerIndex || 'UserManager'].accessBlockchain(this.$store.state, actionParams, value)
    //   .then((responseObject) => {
    //     if (payload.callback) payload.callback(responseObject)
    //   })
    //   .catch((err) => {
    //     if (payload.callback) payload.callback(false)
    //     console.error(err, `Unable to ${payload.methodName}. You may not need to pay any attention to this error. A page load on Sign Up may throw this error, but everything is fine.`)
    //   })
    // }
  },
  watch: {
    hasInjectedWeb3 (web3ConnectionValue) {
      console.log('hasInjectedWeb3: ', web3ConnectionValue)
    },
    networkId (networkId) {
      console.log('networkId: ', networkId)
    },
    coinbase (coinbase) {
      console.log('coinbase: ', coinbase)
    },
    isDAppReady (isDAppReady) {
      console.log('isDAppReady: ', isDAppReady)
    },
    $route (newRoute) {
      this[ACTION_TYPES.CHANGE_CURRENT_ROUTE_TO](newRoute)
      this[ACTION_TYPES.SET_CURRENT_VIEW](newRoute)
      // const isValidUserBut = this.$route.query.isValidUserBut
      // if (isValidUserBut) {
      //   this.callSetIsValidUserBut(isValidUserBut)
      // } else {
      //   this.callResetIsValidUserBut()
      // }
    }
  }
})
