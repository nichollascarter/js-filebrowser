<template>
    <div class="fe-login-form">
        <div class="fe-form-group">                                     
		    <input class="fe-login-input" id="email" type="email" v-model="email" required autofocus placeholder="Enter email">
        </div>
        <div class="fe-form-group"> 
		    <input class="fe-login-input" id="password" type="password" v-model="password" required placeholder="Password">
        </div>
		 <button class="fe-login-button btn-block" type="submit" @click="handleSubmit"> 
            Login
        </button>
	</div>
</template>

<script>
    import { defineAbilityFor } from '../abilities'
    import { HTTP_PREFIX } from '../providers/common'

    export default {
        data(){
            return {
                email : '',
                password : ''
            }
        },
        methods : {
            handleSubmit(e){
                e.preventDefault()
                if (this.password.length > 0) {
                    this.$http.post(HTTP_PREFIX + 'login', {
                        email: this.email,
                        password: this.password
                    }, 
                    {
                        headers: {
                            'content-type': 'application/json',
                        }   
                    })
                    .then(response => {
                        localStorage.setItem('jwt', response.data.token);

                        if (localStorage.getItem('jwt') !== null) {
                            this.$ability.update(
                                defineAbilityFor(response.data.permissions).rules
                            );
                            this.$emit('loggedIn');
                            if (this.$route.params.nextUrl) {
                                //this.$router.push(this.$route.params.nextUrl)
                            } else {
                                this.$router.push('/');
                            }
                        }
                    })
                    .catch(function (error) {
                        //console.error(error);
                    });
                }
            }
        }
    }
</script>

<style>
 
.fe-login-form {
    width:400px;
    height: auto;
    margin: auto;
    margin-top: 10%;
    background-color: #edeff1;
    padding: 24px 23px 20px;
    position: relative;
    /* border-radius: 6px; */
    box-sizing: border-box;
}

.fe-form-group {
    position: relative;
    margin-bottom: 20px;
}

.fe-login-input {
    width: 100%;
    border: 2px solid transparent;
    color: #34495e;
    font-family: "Lato", Helvetica, Arial, sans-serif;
    font-size: 15px;
    line-height: 1.467;
    padding: 8px 12px;
    height: 42px;
    /* border-radius: 6px; */
    box-shadow: none;
    transition: border .25s linear, color .25s linear, background-color .25s linear;
}

.fe-login-button {
    border: none;
    color: white;
    background-color: #34495e;
    padding: 10px 19px;
    font-size: 17px;
    line-height: 1.471;
    border-radius: 2px;
}

</style>