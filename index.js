
const EventEmitter = require('events')
const ReactionRole = require("./classes/ReactionRole.js")
const ReactionRoleMessage = require("./classes/ReactionRoleMessage.js")

class Rero extends EventEmitter {
    
    /*  ______                    
        | ___ \                   
        | |_/ /  ___  _ __   ___  
        |    /  / _ \| '__| / _ \ 
        | |\ \ |  __/| |   | (_) |
        \_| \_| \___||_|    \___/
    */
    //  Reaction-role system for Discord bots

    constructor(client, data){

        this.client = client

        if(!data instanceof Array) throw Error("You must use an Array for the second argument (see docs)")

        this.reactionRoleMessages = data.map(reactionRoleMessageData => new ReactionRoleMessage(client, reactionRoleMessageData))

        this.isSet = Promise.all(reactionRoleMessages.map(reactionRoleMessage => reactionRoleMessage.isSet))
        this.isSet
            .then(isSet => this.emit("ready"))
            .catch(error => this.emit("error",error))

        client.on("raw", this._rawListener)
    }

    addReactionRoleMessage(channel, embed, type){
        const reactionRoleMessage = new ReactionRoleMessage(
            this.client,
            {
                guildID : channel.guild.id,
                channelID : channel.id,
                embed : embed,
                ReactionRoles : [],
                type : type
            }
        )
        this.reactionRoleMessages.push(reactionRoleMessage)
        return reactionRoleMessage
    }

    addReactionRole(message, role, emoji){
        const reactionRole = new ReactionRole(
            this.getReactionRoleMessage(message),
            {
                roleID : role.id,
                emojiID : emojiID || emoji.name
            }
        )
    }

    getReactionRoleMessage(message){
        return this.reactionRoleMessages.find(reactionRoleMessage => reactionRoleMessage.id == message.id)
    }

    getReactionRole(message, role, emoji){
        return this.getReactionRoleMessage(message).reactionRoles.find(reactionRole => {
            return reactionRole.role.id == role.id && (
                reactionRole.emojiID == emoji || 
                reactionRole.emojiID == emoji.id || 
                reactionRole.emojiID == emoji.name
            )
        })
    }

    refresh(){
        return Promise.all(this.reactionRoleMessages.map(reactionRoleMessage => (new ReactionRoleMessage(this.client, reactionRoleMessage.data)).isSet))
    }

    deleteAll(){
        return Promise.all(this.reactionRoleMessages.map(reactionRoleMessage => reactionRoleMessage.delete()))
    }

    get data(){
        return this.reactionRoleMessages.map(reactionRoleMessage => reactionRoleMessage.data)
    }

    _rawListener(data){

        if(
            data.t != "MESSAGE_REACTION_ADD" &&
            data.t != "MESSAGE_REACTION_REMOVE"
        ) return

        const channel = this.client.channels.get(data.d.channel_id)

        channel.fetchMessage(data.d.message_id).then(message => {

            const emoji = data.d.emoji.id ? `${data.d.emoji.name}:${data.d.emoji.id}` : data.d.emoji.name
            const reaction = message.reactions.get(emoji)
            const reactionRole = this.getReactionRole(message, role, reaction.emoji)
            const member = channel.guild.members.get(data.d.user_id)

            if(reactionRole){

                if(reactionRole.reactionRoleMessage.type == "button"){
                    if(data.t == "MESSAGE_REACTION_ADD"){
                        reaction.remove(member.id)
                            .catch(console.error)
                        if(member.roles.has(reactionRole.role.id)){
                            member.removeRole(reactionRole.role.id)
                                .then(() => this.emit("reactionRoleRemove", reactionRole, member))
                                .catch(error => this.emit("error",error))
                        }else{
                            member.addRole(reactionRole.role.id)
                                .then(() => this.emit("reactionRoleAdd", reactionRole, member))
                                .catch(error => this.emit("error",error))
                        }
                    }
                }else{
                    if(data.t == "MESSAGE_REACTION_ADD"){
                        if(reactionRole.reactionRoleMessage.type == "radio"){
                            reactionRole.message.reactions.forEach(messageReaction => {
                                if(messageReaction.id == reactionRole.messageReacion.id) return
                                messageReaction.remove(member.id)
                                    .catch(console.error)
                            })
                        }
    
                        if(!member.roles.has(reactionRole.role.id)){
                            member.addRole(reactionRole.role.id)
                                .then(() => this.emit("reactionRoleAdd", reactionRole, member))
                                .catch(error => this.emit("error",error))
                        }
                    }else{
                        if(member.roles.has(reactionRole.role.id)){
                            member.removeRole(reactionRole.role.id)
                                .then(() => this.emit("reactionRoleRemove", reactionRole, member))
                                .catch(error => this.emit("error",error))
                        }
                    }
                }
            }
        })
    }
}

module.exports = Rero