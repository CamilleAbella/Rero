const { RichEmbed } = require("discord.js")
const EventEmitter = require('events')
const ReactionRole = require("./ReactionRole.js")

class ReactionRoleMessage extends EventEmitter {

    constructor(client,data){
        this.options = data.options
        this.client = client
        this.id = data.id
        this.guild = client.guilds.get(data.guildID)
        this.channel = client.channels.get(data.channelID)
        this.richEmbed = new RichEmbed(data.embed)
        this.set = new Promise(async resolve => {
            try{
                if(this.channel){
                    this.message = await this.channel.fetchMessage(data.messageID)
                    if(!this.message){
                        this.message = await this.channel.send(this.richEmbed)
                    }
                    this.reactionRoles = data.reactionRoles.map(reactionRole => new ReactionRole(this,reactionRole))
                    const all = await Promise.all(this.reactionRoles.map(reactionRole => reactionRole.set))
                    if(all.every(set => set)){
                        this.emit("set")
                        resolve(true)
                    }
                }
            }catch(error){
                this.emit("error",error)
                resolve(false)
            }
        })
    }

    async delete(){
        if(this.message){
            await this.message.delete()
        }
        delete this
    }
    
    get data(){
        return {
            id : this.id,
            guildID : this.guild.id,
            channelID : this.channel ? this.channel.id : null,
            messageID : this.message ? this.message.id : null,
            embed : this.richEmbed._apiTransform(),
            reactionRoles : this.reactionRoles.map(reactionRole => reactionRole.data),
            options : this.options
        }
    }
}

module.exports = ReactionRoleMessage