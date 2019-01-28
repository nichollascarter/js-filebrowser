<template>
    <div id="app">
        <router-view/>
    </div>
</template>

<script>
    export default {
        name: 'App'
    }
</script>

<style>

    #app {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
    }
    body {
        margin: 0;
        padding: 0;
        font-family: "Lato", Helvetica, Arial, sans-serif;
        color: #34495e;
    }
    h3 {
        font: bold 23px/40px "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    .fe-modal-input {
        border: 1px solid #bdc3c7;
        color: #34495e;
        font-family: "Lato", Helvetica, Arial, sans-serif;
        font-size: 15px;
        line-height: 1.467;
        padding: 8px 12px;
        height: 35px;
        border-radius: 4px;
        box-shadow: none;
        transition: border .25s linear, color .25s linear, background-color .25s linear;
    }

    .modal-mask {
        position: fixed;
        z-index: 9998;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, .5);
        display: table;
        transition: opacity .3s ease;
    }

    .modal-wrapper {
        display: table-cell;
        vertical-align: middle;
    }

    .property-container {
        width: 50%;
        margin: 0px auto;
        padding: 20px 30px;
        background-color: #fff;
        border-radius: 2px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, .33);
        transition: all .3s ease;
        font-family: Helvetica, Arial, sans-serif;
    }

    .modal-header h3 {
        margin-top: 0;
    }

    .modal-body {
        margin: 20px 0;
    }

    .modal-enter {
        opacity: 0;
    }

    .modal-leave-active {
        opacity: 0;
    }

    .modal-enter .property-container,
    .modal-leave-active .property-container {
        -webkit-transform: scale(1.1);
        transform: scale(1.1);
    }

    input, select, button {
        outline: none;
    }
</style>
