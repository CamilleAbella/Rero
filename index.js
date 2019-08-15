
const EventEmitter = require('events')
const ReactionRole = require("./classes/ReactionRole.js")
const ReactionRoleMessage = require("./classes/ReactionRoleMessage.js")

class Rero extends EventEmitter {

    // Gestion de tout le bordel
    // Listeners et compagnie

    constructor(client, data){

        this.client = client

        if(!data instanceof Array) throw Error("You must use an Array for the second argument (see docs)")

        this.reactionRoleMessages = data.map(reactionRoleMessageData => new ReactionRoleMessage(client, reactionRoleMessageData))

        this.isSet = Promise.all(reactionRoleMessages.map(reactionRoleMessage => reactionRoleMessage.isSet))
        this.isSet
            .then(isSet => this.emit("ready"))
            .catch(error => this.emit("error",error))
    }

    addReactionRoleMessage(channel, embed, options){
        const reactionRoleMessage = new ReactionRoleMessage(
            this.client,
            {
                guildID : channel.guild.id,
                channelID : channel.id,
                embed : embed,
                ReactionRoles : [],
                options : options
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
                emojiID : emoji.id || emoji.name
            }
        )
    }

    getReactionRoleMessage(message){
        return this.reactionRoleMessages.find(reactionRoleMessage => reactionRoleMessage.id == message.id)
    }

    getReactionRole(message, role, emoji){
        return this.getReactionRoleMessage(message).reactionRoles.find(reactionRole => {
            return reactionRole.role.id == role.id && (reactionRole.emoji.id || reactionRole.emoji.name) == (emoji.id || emoji.name)
        })
    }

    refresh(){

    }

    deleteAll(){
        return Promise.all(this.reactionRoleMessages.map(reactionRoleMessage => reactionRoleMessage.delete()))
    }

    get data(){
        return this.reactionRoleMessages.map(reactionRoleMessage => reactionRoleMessage.data)
    }
}

module.exports = Rero
