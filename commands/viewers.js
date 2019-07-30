const helper = require('../helper.js');
const axios = require('axios');
const config = require('../config.json');
const moment = require('moment');
require("moment-duration-format");

const twitchkraken = axios.create({
    baseURL: 'https://api.twitch.tv/kraken',
    headers: {
        'Accept': 'application/vnd.twitchtv.v5+json',
        'Client-ID': config.credentials.twitch_client_id
    }
});

module.exports = {
    command: 'viewers',
    description: "See how many people are watching a Twitch channel.",
    argsRequired: 1,
    usage: '<twitch username>',
    example: {
        run: "viewers distortion2",
        result: "Returns how many viewers distortion2 currently has (if they're live)."
    },
    configRequired: ['credentials.twitch_client_id'],
    call: obj => {
        return new Promise((resolve, reject) => {
            let { argv } = obj;

            let channel_name = argv[1];

            twitchkraken.get(`/users`, {
                params: {
                    'login': channel_name,
                },
            }).then(response => {
                let users = response.data.users;

                if(users.length == 0){
                    reject('User not found');
                    return;
                }

                let user_id = users[0]._id;

                twitchkraken.get(`/streams/${user_id}`).then(response => {
                    let stream = response.data.stream;

                    if(stream != null){
                        let channel = stream.channel;

                        let display_name = channel.display_name;
                        let viewers = stream.viewers.toLocaleString() + " viewer";
                        if(parseInt(stream.viewers) != 1) viewers += "s";
                        let game = stream.game;
                        let status = channel.status;
                        let quality = Math.round(stream.video_height) + "p" + Math.round(stream.average_fps);

                        resolve({
                            embed: {
                                color: 6570404,
                                author: {
                                    icon_url: "https://cdn.discordapp.com/attachments/572429763700981780/572429816851202059/GlitchBadge_Purple_64px.png",
                                    url: channel.url,
                                    name: display_name
                                },
                                title: status,
                                url: channel.url,
                                description: `**Game**: ${game}\n**Viewers**: ${viewers}\n**Quality**: ${quality}`,
                                thumbnail: {
                                    url: channel.logo
                                },
                                footer: {
                                    text: `Live for ${moment.duration(Math.max(0, moment().unix() - moment(stream.created_at).unix()), "seconds").format("h [hour and] m [minute]")}`
                                }
                            }
                        });
                    }else{
                        reject(`${channel_name} is currently not live`);
                    }
                }).catch(err => {
                    helper.error(err);
                    reject('User not found');
                });
            }).catch(err => {
                helper.error(err);
                reject('User not found');
            });
        });
    }
};
