<template>
    <div>
        채팅방 목록
        <button @click="makeRoom">방 만들기</button>
        <hr>
        <div v-if="roomList.length == 0">방없음</div>
        <div v-else>
            <div v-for="(room, idx) in roomList" :key="idx">
                {{room.roomName}}
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios'
import Stomp from 'webstomp-client'
import SockJS from 'sockjs-client'

export default {
    data() {
        return {
            roomList: [],
        }
    },
    created() {
        this.start();
    },
    methods: {
        start() {
            const socket = new SockJS('http://localhost:9998/realsocket/websocket');
            this.$store.state.stompClient = Stomp.over(socket);
            this.$store.state.stompClient.connect(
                {},
                () => {
                console.log("야호 연결성공요")
                this.$store.state.stompClient.subscribe("/topic/roomList", () => {
                    this.updateRoomList();
                    //e로 던저서 e.body로 받았어요
                })
                this.updateRoomList();
            });
        },
        updateRoomList() {
            axios.get("http://localhost:9998/realsocket/chatingRoomList").then(({data}) => {
                this.roomList = data;
            })
        },
        makeRoom() {
            var roomName = prompt("방제목을 입력해주세요");
            if (roomName == null) return;
            var userId = prompt("닉네임을 입력해주세요");
            if (userId == null) return;
            console.log(roomName, userId)
            axios.post("http://localhost:9998/realsocket/chatingRoom", {"roomName": roomName, "userId": userId}).then(({data}) => {
                console.log(data)
                sessionStorage.setItem("roomNumber", data)
                // 내가 방을 만든 사실을 구독자들에게 알려줘요
                this.$store.state.stompClient.send("/topic/roomList")
                this.$router.push( {path: '/ChatView/' + roomName + "/" + userId} )
            })
        },
    },
};
</script>

<style>
</style>

