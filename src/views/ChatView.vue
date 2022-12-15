<template>
    <div>
        방이름:{{this.$route.params.roomName}}<br>
        참가자:
        <hr>
        <input>
        <button>전송</button>
        <div>

            여기에 채팅내용이 나타나요

        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            userList: []
        }
    },
    created() {
        this.start();
    },
    methods: {
        start() {
            
        }
    },
    
};
</script>

<style>
</style>