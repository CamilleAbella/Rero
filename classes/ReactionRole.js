const { RichEmbed } = require("discord.js")
const EventEmitter = require('events')

class ReactionRole extends EventEmitter {
    
    constructor(reactionRoleMessage, data){

        this.reactionRoleMessage = reactionRoleMessage
        
        [
            "client",
            "guild",
            "channel",
            "message"
        ].forEach(prop => {
            this.defineProperty( this, prop, reactionRoleMessage[prop])
        })

        this.emojiID = data.emojiID
        this.role = this.guild.roles.get(data.roleID)

        this.isSet = new Promise(async resolve => {

            if(this.message){
                this.messageReaction = this.message.reactions.find(messageReaction => {
                    return (
                        messageReaction.emoji.name == this.emojiID || 
                        messageReaction.emoji.id == this.emojiID
                    )
                })
                try{
                    if(!this.messageReaction){
                        this.messageReaction = await this.message.react(this.emojiID)
                    }

                    await this.messageReaction.fetchUsers()

                    for(const [id,user] of this.messageReaction.users){
                        const member = this.guild.members.get(user.id)
                        if(!member.roles.has(this.role.id)){
                            await member.addRole(this.role.id)
                        }
                    }
                    this.emit("ready")
                    resolve(true)
                }catch(error){
                    this.emit("error",error)
                    resolve(false)
                }
            }
        })
    }

    async delete(){
        if(this.messageReaction){
            await this.messageReaction.remove()
        }
        this.reactionRoleMessage.reactionRoles = this.reactionRoleMessage.reactionRoles.filter(reactionRole => {
            return reactionRole.id != this.id
        })
        delete this
    }
    
    get id(){
        return this.message && this.role && this.emojiID ? `${this.message.id}.${this.role.id}.${this.emojiID}` : null
    }

    get data(){
        return {
            id : this.id,
            roleID : this.role.id,
            emojiID : this.emojiID
        }
    }
}

module.exports = ReactionRole