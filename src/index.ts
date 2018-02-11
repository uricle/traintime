import Vue from 'vue';

declare var times: { [key: string]: any };

let thisapp: any;
let loaded: HTMLScriptElement = null;
document.addEventListener("DOMContentLoaded", function (event) {
    console.log("DOM fully loaded and parsed");
    const ap = new app();
    thisapp = ap;
    document.title = 'test';
    const timer = setInterval(() => {
        (<any>ap).now = new Date();
    }, 1000);
});
const app = Vue.extend({
    el: '#app',
    data() {
        return {
            all: false,
            title: 'test',
            times: times,
            now: new Date(),
        }
    },
    computed: {
        currenttime: function () {
            const now = (<Date>(<any>this.now));
            return now.toLocaleTimeString();
        },
        hours: function (): number[] {
            const hours = Object.keys(this.times)
                .filter(key => key.match(/^\d+$/))
                .map(x => parseInt(x))
                .sort((a, b) => a - b);
            if (this.all) {
                return hours;
            }
            if (!this.now) {
                return hours;
            }
            const now = this.now;
            let nowhour = (<Date>(<any>now)).getHours();
            if (nowhour < 6) {
                nowhour += 24;
            }
            return hours.filter(x => x >= nowhour);
        },
        nextTime: function (): {
            hour: number, min: number, depart: number,
            ahour: number, amin: number, adepart: number
        } {
            let next = -1;
            const now = <Date>(<any>this.now);
            const currentmin = now.getMinutes();
            const currenthour = now.getHours();
            // const currenthour = 24;
            // const currentmin = 9;
            const retvalue = {
                hour: 0, min: 0, depart: 0,
                ahour: 0, amin: 0, adepart: 0
            };
            const getdepart = <Function>this.getdepart;
            const nextTimeInfo = getdepart(this.times, currenthour, currentmin);
            if (nextTimeInfo) {
                retvalue.hour = nextTimeInfo.hour;
                retvalue.min = nextTimeInfo.min;
                retvalue.depart = nextTimeInfo.depart;
                const afterTimeInfo = getdepart(this.times, retvalue.hour, retvalue.min);
                if (afterTimeInfo) {
                    retvalue.ahour = afterTimeInfo.hour;
                    retvalue.amin = afterTimeInfo.min;
                    retvalue.adepart = nextTimeInfo.depart + afterTimeInfo.depart;
                }
            }
            if (retvalue.hour === 0) {
                return null;
            } else {
                return retvalue;
            }
        }
    },
    methods: {
        mins: function (hour: number): string[] {
            const times: { [key: string]: string[] } = <any>this.times;
            return times[hour];
        },
        getdepart: function (table: number[][], chour: number, cmin: number) {
            if (!table || table.length < 1) {
                return null;
            }
            let curTimeTable = table[chour];
            const firstIndex = curTimeTable.findIndex((value) => {
                return cmin < value;
            });
            if (firstIndex >= 0) {
                return { hour: chour, min: curTimeTable[firstIndex], depart: curTimeTable[firstIndex] - cmin }
            }
            if (chour + 1 in table) {
                return { hour: chour + 1, min: table[chour + 1][0], depart: 60 + table[chour + 1][0] - cmin };
            }
            return null;
        },
        setTimetable(script:string) {
            if ( loaded ) {
                loaded.parentElement.removeChild(loaded);
            }
            const js = document.createElement('script');
            js.type = 'text/javascript';
            js.src = script;
            js.onload = (event) => {
                thisapp.times = times;        
            }
            const s = document.getElementsByTagName('script')[0];
            s.parentNode.insertBefore(js,s);
            loaded = js;
        }
    },
    nowhour: function (): number {
        const now = this.now;
        let nowhour = (<Date>(<any>now)).getHours();
        if (nowhour < 6) {
            nowhour += 24;
        }
        return nowhour;
    }
});
