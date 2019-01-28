<template>
    <transition name="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @click.stop>

                    <div class="modal-header">
                        <slot name="header">
                            <h3> Register user </h3>
                        </slot>
                    </div>

                    <div class="modal-body">
                        <slot name="body">
                            <form>
                                <label for="name">Name</label>
                                <div>
                                    <input class="fe-modal-input" id="name" type="text" v-model="name" required autofocus>
                                </div>

                                <label for="email" >E-Mail Address</label>
                                <div>
                                    <input class="fe-modal-input" id="email" type="email" v-model="email" required>
                                </div>

                                <label for="password">Password</label>
                                <div>
                                    <input class="fe-modal-input" id="password" type="password" v-model="password" required>
                                </div>

                                <label for="password-confirm">Confirm Password</label>
                                <div>
                                    <input class="fe-modal-input" id="password-confirm" type="password" v-model="password_confirmation" required>
                                </div>
                                <label for="group">Select User Group</label>
                                <div>
                                    <select class="fe-modal-input" v-model="group">
                                        <option v-for="item in groups" :key="item.name" :value="item.name">{{item.name}}</option>
                                    </select>
                                </div>

                                <label for="password-confirm">Is this an administrator account?</label>
                                <div>
                                    <select class="fe-modal-input" v-model="is_admin">
                                        <option value=1>Yes</option>
                                        <option value=0>No</option>
                                    </select>
                                </div>
                            </form>
                        </slot>
                    </div>

                    <div class="modal-footer">
                        <slot name="footer">
                            <button class="btn center-block fe-submit-button" @click="handleSubmit">
                                Register
                            </button>
                        </slot>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>
<script>
    import { HTTP_PREFIX } from '../../providers/common'
    
    export default {
        props: ['groups'],
        data(){
            return {  
                name : '',
                email : '',
                password : '',
                password_confirmation : '',
                group: '',
                is_admin : null, 
            }
        },
        methods: {
             httpPost(url, data, callback) {
                const ctx  = this;
                ctx.$http.post(url,
                data, 
                {
                    headers: {
                        auth: localStorage.getItem('jwt'),
                    }
                })
                .then(response => {
                    callback(
                        response.data
                    );
                })
                .catch(function (error) {
                    if (error.response.status === 401) {
                        ctx.logout();
                    }
                });
            },
            handleSubmit(e) {
                e.preventDefault();

                if (this.password === this.password_confirmation && 
                    this.password.length > 0 && 
                    this.group !== '') {         
                    this.httpPost(HTTP_PREFIX + 'register', {
                        name: this.name,
                        email: this.email,
                        group: this.group,
                        password: this.password,
                        is_admin: this.is_admin
                    }, response => {
                        this.$emit('close');
                        this.$parent.$emit('onRegister');
                    });
                } else {
                    this.password = '';
                    this.passwordConfirm = '';
                    return alert("Passwords do not match");
                }
            },
        }          
    }
</script>

<style>
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

    .modal-container {
        width: 300px;
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

    .modal-enter .modal-container,
    .modal-leave-active .modal-container {
        -webkit-transform: scale(1.1);
        transform: scale(1.1);
    }
    
</style>