/**
 * Emoji replace
 * @author Kyle Young
 */
;(function(Root, undefined)
{
    "use strict";

    Array.from = Array.from || function(str)
    {
        var i = 0,
            c,
            code,
            ret = [];

        str = String(str);

        while(i < str.length)
        {
            c = str[i];
            code = c.charCodeAt();

            if(code >= 0xD800 && code <= 0xDBFF)
            {
                c += str[++i];
            }

            ret.push(c);

            ++i;
        }

        return ret;
    };

    String.fromCodePoint = String.fromCodePoint || function()
    {
        var MAX_SIZE = 0x4000;
        var codeUnits = [];
        var highSurrogate;
        var lowSurrogate;
        var index = -1;
        var length = arguments.length;

        if (!length) 
        {
            return '';
        }

        var result = '';
        while (++index < length) 
        {
            var codePoint = Number(arguments[index]);

            if (!isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
                        codePoint < 0 || // not a valid Unicode code point
                        codePoint > 0x10FFFF || // not a valid Unicode code point
                        Math.floor(codePoint) != codePoint // not an integer
                    )
            {
                throw RangeError('Invalid code point: ' + codePoint);
            }

            if (codePoint <= 0xFFFF) 
            { 
                // BMP code point
                codeUnits.push(codePoint);
            } 
            else 
            {
                // Astral code point; split in surrogate halves
                // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
                codePoint -= 0x10000;
                highSurrogate = (codePoint >> 10) + 0xD800;
                lowSurrogate = (codePoint % 0x400) + 0xDC00;
                codeUnits.push(highSurrogate, lowSurrogate);
            }

            if (index + 1 == length || codeUnits.length > MAX_SIZE) 
            {
                result += String.fromCharCode.apply(null, codeUnits);
                codeUnits.length = 0;
            }
        }

        return result;
    };

    String.prototype.codePointAt = String.prototype.codePointAt || function(index)
    {
        index = index || 0;

        var h, l,
            chrH = this[index],
            chrL = this[index + 1];

        if(!chrH)
        {
            return;
        }

        h = chrH.charCodeAt(0);

        if(chrL)
        {
            l = chrL.charCodeAt(0);
        }
        else
        {
            l = 0;
        }

        // 0x010000 - 0x10FFFF
        if(h >= 0xD800 && h <= 0xDBFF
                && l >= 0xDC00 && l <= 0xDFFF)
        {
            return (
                ((h ^ 0xD800) << 10) | (l ^ 0xDC00)
            ) + 0x10000;
        }
        else
        {
            return h;
        }
    };

    var Emoji = {

        replace: function(str, callback)
        {
            // str = Emoji.replaceGoogle(str, function(c)
            // {
            //     return Emoji.mapSingle(c, 'google', 'unified') || c;
            // });

            str = Emoji.replaceSoftbank(str, function(c)
            {
                return Emoji.mapSingle(c, 'softbank', 'unified') || c;
            });

            str = Emoji.replaceUnified(str, callback || '');

            return str;
        },

        replaceSoftbank: function(str, callback)
        {
            return str.replace(Emoji.regSoftbankEmoji, callback);
        },

        replaceUnified: function(str, callback)
        {
            return str.replace(Emoji.regUnifiedEmoji, callback);
        },

        replaceQQFace: function(str, callback)
        {
            return str.replace(Emoji.regQQFace, callback);
        },

        mapSingle: function(emoji, from, to)
        {
            if(from && to)
            {
                var rQQMap = /^qq_/;
                if(rQQMap.test(from) ^ rQQMap.test(to))
                {
                    console.error('QQ表情和Emoji表情之间不存在对应关系！');
                }
            }

            from = Emoji.Map[from.toLowerCase()];

            if(from && to)
            {
                to = Emoji.Map[to.toLowerCase()];
                return to[from.indexOf(emoji)];
            }
            else if(from)
            {
                return from.indexOf(emoji);
            }
        },

        getHexString: function(str)
        {
            var i = 0, charCode, chr, hexStr = '';

            while(i < str.length)
            {
                chr = str[i];
                charCode = chr.charCodeAt();

                if(charCode >= 0xD800 && charCode <= 0xDBFF)
                {
                    hexStr += Emoji.unicode(chr + str[++i]).toString(16);
                }
                else
                {
                    hexStr += Emoji.unicode(chr).toString(16);
                }

                i++
            }

            return hexStr.toLowerCase();
        },
    
        // 获取字符的 unicode
        unicode: function(charactor)
        {
            var h = charactor.charCodeAt(0),
                l = charactor.charCodeAt(1);

            // 大于2字节的字符
            if(h >= 0xD800 && h <= 0xDBFF)
            {
                return (
                    ((h ^ 0xD800) << 10) | (l ^ 0xDC00)
                ) + 0x10000;
            }
            else
            {
                return h;
            }
        }
    };

    // Unified Softbank Google EnName 
    Emoji.Map = [
        ["\u2600", "\ue04a", "\udbb8\udc00", "sunny"],
        ["\u2601", "\ue049", "\udbb8\udc01", "cloud"],
        ["\u2614", "\ue04b", "\udbb8\udc02", "umbrella"],
        ["\u26c4", "\ue048", "\udbb8\udc03", "snowman"],
        ["\u26a1", "\ue13d", "\udbb8\udc04", "zap"],
        ["\ud83c\udf00", "\ue443", "\udbb8\udc05", "cyclone"],
        ["\ud83c\udf01", null, "\udbb8\udc06", "foggy"],
        ["\ud83c\udf02", "\ue43c", "\udbb8\udc07", "closed_umbrella"],
        ["\ud83c\udf03", "\ue44b", "\udbb8\udc08", "night_with_stars"],
        ["\ud83c\udf04", "\ue04d", "\udbb8\udc09", "sunrise_over_mountains"],
        ["\ud83c\udf05", "\ue449", "\udbb8\udc0a", "sunrise"],
        ["\ud83c\udf06", "\ue146", "\udbb8\udc0b", "city_sunset"],
        ["\ud83c\udf07", "\ue44a", "\udbb8\udc0c", "city_sunrise"],
        ["\ud83c\udf08", "\ue44c", "\udbb8\udc0d", "rainbow"],
        ["\u2744", null, "\udbb8\udc0e", "snowflake"],
        ["\u26c5", "\ue04a\ue049", "\udbb8\udc0f", "partly_sunny"],
        ["\ud83c\udf09", "\ue44b", "\udbb8\udc10", "bridge_at_night"],
        ["\ud83c\udf0a", "\ue43e", "\udbb8\udc38", "ocean"],
        ["\ud83c\udf0b", null, "\udbb8\udc3a", "volcano"],
        ["\ud83c\udf0c", "\ue44b", "\udbb8\udc3b", "milky_way"],
        ["\ud83c\udf0f", null, "\udbb8\udc39", "earth_asia"],
        ["\ud83c\udf11", null, "\udbb8\udc11", "new_moon"],
        ["\ud83c\udf14", "\ue04c", "\udbb8\udc12", "moon"],
        ["\ud83c\udf13", "\ue04c", "\udbb8\udc13", "first_quarter_moon"],
        ["\ud83c\udf19", "\ue04c", "\udbb8\udc14", "crescent_moon"],
        ["\ud83c\udf15", null, "\udbb8\udc15", "full_moon"],
        ["\ud83c\udf1b", "\ue04c", "\udbb8\udc16", "first_quarter_moon_with_face"],
        ["\ud83c\udf1f", "\ue335", "\udbba\udf69", "star2"],
        ["\ud83c\udf20", null, "\udbba\udf6a", "stars"],
        ["\ud83d\udd50", "\ue024", "\udbb8\udc1e", "clock1"],
        ["\ud83d\udd51", "\ue025", "\udbb8\udc1f", "clock2"],
        ["\ud83d\udd52", "\ue026", "\udbb8\udc20", "clock3"],
        ["\ud83d\udd53", "\ue027", "\udbb8\udc21", "clock4"],
        ["\ud83d\udd54", "\ue028", "\udbb8\udc22", "clock5"],
        ["\ud83d\udd55", "\ue029", "\udbb8\udc23", "clock6"],
        ["\ud83d\udd56", "\ue02a", "\udbb8\udc24", "clock7"],
        ["\ud83d\udd57", "\ue02b", "\udbb8\udc25", "clock8"],
        ["\ud83d\udd58", "\ue02c", "\udbb8\udc26", "clock9"],
        ["\ud83d\udd59", "\ue02d", "\udbb8\udc27", "clock10"],
        ["\ud83d\udd5a", "\ue02e", "\udbb8\udc28", "clock11"],
        ["\ud83d\udd5b", "\ue02f", "\udbb8\udc29", "clock12"],
        ["\u231a", null, "\udbb8\udc1d", "watch"],
        ["\u231b", null, "\udbb8\udc1c", "hourglass"],
        ["\u23f0", "\ue02d", "\udbb8\udc2a", "alarm_clock"],
        ["\u23f3", null, "\udbb8\udc1b", "hourglass_flowing_sand"],
        ["\u2648", "\ue23f", "\udbb8\udc2b", "aries"],
        ["\u2649", "\ue240", "\udbb8\udc2c", "taurus"],
        ["\u264a", "\ue241", "\udbb8\udc2d", "gemini"],
        ["\u264b", "\ue242", "\udbb8\udc2e", "cancer"],
        ["\u264c", "\ue243", "\udbb8\udc2f", "leo"],
        ["\u264d", "\ue244", "\udbb8\udc30", "virgo"],
        ["\u264e", "\ue245", "\udbb8\udc31", "libra"],
        ["\u264f", "\ue246", "\udbb8\udc32", "scorpius"],
        ["\u2650", "\ue247", "\udbb8\udc33", "sagittarius"],
        ["\u2651", "\ue248", "\udbb8\udc34", "capricorn"],
        ["\u2652", "\ue249", "\udbb8\udc35", "aquarius"],
        ["\u2653", "\ue24a", "\udbb8\udc36", "pisces"],
        ["\u26ce", "\ue24b", "\udbb8\udc37", "ophiuchus"],
        ["\ud83c\udf40", "\ue110", "\udbb8\udc3c", "four_leaf_clover"],
        ["\ud83c\udf37", "\ue304", "\udbb8\udc3d", "tulip"],
        ["\ud83c\udf31", "\ue110", "\udbb8\udc3e", "seedling"],
        ["\ud83c\udf41", "\ue118", "\udbb8\udc3f", "maple_leaf"],
        ["\ud83c\udf38", "\ue030", "\udbb8\udc40", "cherry_blossom"],
        ["\ud83c\udf39", "\ue032", "\udbb8\udc41", "rose"],
        ["\ud83c\udf42", "\ue119", "\udbb8\udc42", "fallen_leaf"],
        ["\ud83c\udf43", "\ue447", "\udbb8\udc43", "leaves"],
        ["\ud83c\udf3a", "\ue303", "\udbb8\udc45", "hibiscus"],
        ["\ud83c\udf3b", "\ue305", "\udbb8\udc46", "sunflower"],
        ["\ud83c\udf34", "\ue307", "\udbb8\udc47", "palm_tree"],
        ["\ud83c\udf35", "\ue308", "\udbb8\udc48", "cactus"],
        ["\ud83c\udf3e", "\ue444", "\udbb8\udc49", "ear_of_rice"],
        ["\ud83c\udf3d", null, "\udbb8\udc4a", "corn"],
        ["\ud83c\udf44", null, "\udbb8\udc4b", "mushroom"],
        ["\ud83c\udf30", null, "\udbb8\udc4c", "chestnut"],
        ["\ud83c\udf3c", "\ue305", "\udbb8\udc4d", "blossom"],
        ["\ud83c\udf3f", "\ue110", "\udbb8\udc4e", "herb"],
        ["\ud83c\udf52", null, "\udbb8\udc4f", "cherries"],
        ["\ud83c\udf4c", null, "\udbb8\udc50", "banana"],
        ["\ud83c\udf4e", "\ue345", "\udbb8\udc51", "apple"],
        ["\ud83c\udf4a", "\ue346", "\udbb8\udc52", "tangerine"],
        ["\ud83c\udf53", "\ue347", "\udbb8\udc53", "strawberry"],
        ["\ud83c\udf49", "\ue348", "\udbb8\udc54", "watermelon"],
        ["\ud83c\udf45", "\ue349", "\udbb8\udc55", "tomato"],
        ["\ud83c\udf46", "\ue34a", "\udbb8\udc56", "eggplant"],
        ["\ud83c\udf48", null, "\udbb8\udc57", "melon"],
        ["\ud83c\udf4d", null, "\udbb8\udc58", "pineapple"],
        ["\ud83c\udf47", null, "\udbb8\udc59", "grapes"],
        ["\ud83c\udf51", null, "\udbb8\udc5a", "peach"],
        ["\ud83c\udf4f", "\ue345", "\udbb8\udc5b", "green_apple"],
        ["\ud83d\udc40", "\ue419", "\udbb8\udd90", "eyes"],
        ["\ud83d\udc42", "\ue41b", "\udbb8\udd91", "ear"],
        ["\ud83d\udc43", "\ue41a", "\udbb8\udd92", "nose"],
        ["\ud83d\udc44", "\ue41c", "\udbb8\udd93", "lips"],
        ["\ud83d\udc45", "\ue409", "\udbb8\udd94", "tongue"],
        ["\ud83d\udc84", "\ue31c", "\udbb8\udd95", "lipstick"],
        ["\ud83d\udc85", "\ue31d", "\udbb8\udd96", "nail_care"],
        ["\ud83d\udc86", "\ue31e", "\udbb8\udd97", "massage"],
        ["\ud83d\udc87", "\ue31f", "\udbb8\udd98", "haircut"],
        ["\ud83d\udc88", "\ue320", "\udbb8\udd99", "barber"],
        ["\ud83d\udc64", null, "\udbb8\udd9a", "bust_in_silhouette"],
        ["\ud83d\udc66", "\ue001", "\udbb8\udd9b", "boy"],
        ["\ud83d\udc67", "\ue002", "\udbb8\udd9c", "girl"],
        ["\ud83d\udc68", "\ue004", "\udbb8\udd9d", "man"],
        ["\ud83d\udc69", "\ue005", "\udbb8\udd9e", "woman"],
        ["\ud83d\udc6a", null, "\udbb8\udd9f", "family"],
        ["\ud83d\udc6b", "\ue428", "\udbb8\udda0", "couple"],
        ["\ud83d\udc6e", "\ue152", "\udbb8\udda1", "cop"],
        ["\ud83d\udc6f", "\ue429", "\udbb8\udda2", "dancers"],
        ["\ud83d\udc70", null, "\udbb8\udda3", "bride_with_veil"],
        ["\ud83d\udc71", "\ue515", "\udbb8\udda4", "person_with_blond_hair"],
        ["\ud83d\udc72", "\ue516", "\udbb8\udda5", "man_with_gua_pi_mao"],
        ["\ud83d\udc73", "\ue517", "\udbb8\udda6", "man_with_turban"],
        ["\ud83d\udc74", "\ue518", "\udbb8\udda7", "older_man"],
        ["\ud83d\udc75", "\ue519", "\udbb8\udda8", "older_woman"],
        ["\ud83d\udc76", "\ue51a", "\udbb8\udda9", "baby"],
        ["\ud83d\udc77", "\ue51b", "\udbb8\uddaa", "construction_worker"],
        ["\ud83d\udc78", "\ue51c", "\udbb8\uddab", "princess"],
        ["\ud83d\udc79", null, "\udbb8\uddac", "japanese_ogre"],
        ["\ud83d\udc7a", null, "\udbb8\uddad", "japanese_goblin"],
        ["\ud83d\udc7b", "\ue11b", "\udbb8\uddae", "ghost"],
        ["\ud83d\udc7c", "\ue04e", "\udbb8\uddaf", "angel"],
        ["\ud83d\udc7d", "\ue10c", "\udbb8\uddb0", "alien"],
        ["\ud83d\udc7e", "\ue12b", "\udbb8\uddb1", "space_invader"],
        ["\ud83d\udc7f", "\ue11a", "\udbb8\uddb2", "imp"],
        ["\ud83d\udc80", "\ue11c", "\udbb8\uddb3", "skull"],
        ["\ud83d\udc81", "\ue253", "\udbb8\uddb4", "information_desk_person"],
        ["\ud83d\udc82", "\ue51e", "\udbb8\uddb5", "guardsman"],
        ["\ud83d\udc83", "\ue51f", "\udbb8\uddb6", "dancer"],
        ["\ud83d\udc0c", null, "\udbb8\uddb9", "snail"],
        ["\ud83d\udc0d", "\ue52d", "\udbb8\uddd3", "snake"],
        ["\ud83d\udc0e", "\ue134", "\udbb9\udfdc", "racehorse"],
        ["\ud83d\udc14", "\ue52e", "\udbb8\uddd4", "chicken"],
        ["\ud83d\udc17", "\ue52f", "\udbb8\uddd5", "boar"],
        ["\ud83d\udc2b", "\ue530", "\udbb8\uddd6", "camel"],
        ["\ud83d\udc18", "\ue526", "\udbb8\uddcc", "elephant"],
        ["\ud83d\udc28", "\ue527", "\udbb8\uddcd", "koala"],
        ["\ud83d\udc12", "\ue528", "\udbb8\uddce", "monkey"],
        ["\ud83d\udc11", "\ue529", "\udbb8\uddcf", "sheep"],
        ["\ud83d\udc19", "\ue10a", "\udbb8\uddc5", "octopus"],
        ["\ud83d\udc1a", "\ue441", "\udbb8\uddc6", "shell"],
        ["\ud83d\udc1b", "\ue525", "\udbb8\uddcb", "bug"],
        ["\ud83d\udc1c", null, "\udbb8\uddda", "ant"],
        ["\ud83d\udc1d", null, "\udbb8\udde1", "bee"],
        ["\ud83d\udc1e", null, "\udbb8\udde2", "beetle"],
        ["\ud83d\udc20", "\ue522", "\udbb8\uddc9", "tropical_fish"],
        ["\ud83d\udc21", "\ue019", "\udbb8\uddd9", "blowfish"],
        ["\ud83d\udc22", null, "\udbb8\udddc", "turtle"],
        ["\ud83d\udc24", "\ue523", "\udbb8\uddba", "baby_chick"],
        ["\ud83d\udc25", "\ue523", "\udbb8\uddbb", "hatched_chick"],
        ["\ud83d\udc26", "\ue521", "\udbb8\uddc8", "bird"],
        ["\ud83d\udc23", "\ue523", "\udbb8\udddd", "hatching_chick"],
        ["\ud83d\udc27", "\ue055", "\udbb8\uddbc", "penguin"],
        ["\ud83d\udc29", "\ue052", "\udbb8\uddd8", "poodle"],
        ["\ud83d\udc1f", "\ue019", "\udbb8\uddbd", "fish"],
        ["\ud83d\udc2c", "\ue520", "\udbb8\uddc7", "dolphin"],
        ["\ud83d\udc2d", "\ue053", "\udbb8\uddc2", "mouse"],
        ["\ud83d\udc2f", "\ue050", "\udbb8\uddc0", "tiger"],
        ["\ud83d\udc31", "\ue04f", "\udbb8\uddb8", "cat"],
        ["\ud83d\udc33", "\ue054", "\udbb8\uddc3", "whale"],
        ["\ud83d\udc34", "\ue01a", "\udbb8\uddbe", "horse"],
        ["\ud83d\udc35", "\ue109", "\udbb8\uddc4", "monkey_face"],
        ["\ud83d\udc36", "\ue052", "\udbb8\uddb7", "dog"],
        ["\ud83d\udc37", "\ue10b", "\udbb8\uddbf", "pig"],
        ["\ud83d\udc3b", "\ue051", "\udbb8\uddc1", "bear"],
        ["\ud83d\udc39", "\ue524", "\udbb8\uddca", "hamster"],
        ["\ud83d\udc3a", "\ue52a", "\udbb8\uddd0", "wolf"],
        ["\ud83d\udc2e", "\ue52b", "\udbb8\uddd1", "cow"],
        ["\ud83d\udc30", "\ue52c", "\udbb8\uddd2", "rabbit"],
        ["\ud83d\udc38", "\ue531", "\udbb8\uddd7", "frog"],
        ["\ud83d\udc3e", "\ue536", "\udbb8\udddb", "feet"],
        ["\ud83d\udc32", null, "\udbb8\uddde", "dragon_face"],
        ["\ud83d\udc3c", null, "\udbb8\udddf", "panda_face"],
        ["\ud83d\udc3d", "\ue10b", "\udbb8\udde0", "pig_nose"],
        ["\ud83d\ude20", "\ue059", "\udbb8\udf20", "angry"],
        ["\ud83d\ude29", "\ue403", "\udbb8\udf21", "weary"],
        ["\ud83d\ude32", "\ue410", "\udbb8\udf22", "astonished"],
        ["\ud83d\ude1e", "\ue058", "\udbb8\udf23", "disappointed"],
        ["\ud83d\ude35", "\ue406", "\udbb8\udf24", "dizzy_face"],
        ["\ud83d\ude30", "\ue40f", "\udbb8\udf25", "cold_sweat"],
        ["\ud83d\ude12", "\ue40e", "\udbb8\udf26", "unamused"],
        ["\ud83d\ude0d", "\ue106", "\udbb8\udf27", "heart_eyes"],
        ["\ud83d\ude24", "\ue404", "\udbb8\udf28", "triumph"],
        ["\ud83d\ude1c", "\ue105", "\udbb8\udf29", "stuck_out_tongue_winking_eye"],
        ["\ud83d\ude1d", "\ue409", "\udbb8\udf2a", "stuck_out_tongue_closed_eyes"],
        ["\ud83d\ude0b", "\ue056", "\udbb8\udf2b", "yum"],
        ["\ud83d\ude18", "\ue418", "\udbb8\udf2c", "kissing_heart"],
        ["\ud83d\ude1a", "\ue417", "\udbb8\udf2d", "kissing_closed_eyes"],
        ["\ud83d\ude37", "\ue40c", "\udbb8\udf2e", "mask"],
        ["\ud83d\ude33", "\ue40d", "\udbb8\udf2f", "flushed"],
        ["\ud83d\ude03", "\ue057", "\udbb8\udf30", "smiley"],
        ["\ud83d\ude05", "\ue415\ue331", "\udbb8\udf31", "sweat_smile"],
        ["\ud83d\ude06", "\ue40a", "\udbb8\udf32", "laughing"],
        ["\ud83d\ude01", "\ue404", "\udbb8\udf33", "grin"],
        ["\ud83d\ude02", "\ue412", "\udbb8\udf34", "joy"],
        ["\ud83d\ude0a", "\ue056", "\udbb8\udf35", "blush"],
        ["\u263a", "\ue414", "\udbb8\udf36", "relaxed"],
        ["\ud83d\ude04", "\ue415", "\udbb8\udf38", "smile"],
        ["\ud83d\ude22", "\ue413", "\udbb8\udf39", "cry"],
        ["\ud83d\ude2d", "\ue411", "\udbb8\udf3a", "sob"],
        ["\ud83d\ude28", "\ue40b", "\udbb8\udf3b", "fearful"],
        ["\ud83d\ude23", "\ue406", "\udbb8\udf3c", "persevere"],
        ["\ud83d\ude21", "\ue416", "\udbb8\udf3d", "rage"],
        ["\ud83d\ude0c", "\ue40a", "\udbb8\udf3e", "relieved"],
        ["\ud83d\ude16", "\ue407", "\udbb8\udf3f", "confounded"],
        ["\ud83d\ude14", "\ue403", "\udbb8\udf40", "pensive"],
        ["\ud83d\ude31", "\ue107", "\udbb8\udf41", "scream"],
        ["\ud83d\ude2a", "\ue408", "\udbb8\udf42", "sleepy"],
        ["\ud83d\ude0f", "\ue402", "\udbb8\udf43", "smirk"],
        ["\ud83d\ude13", "\ue108", "\udbb8\udf44", "sweat"],
        ["\ud83d\ude25", "\ue401", "\udbb8\udf45", "disappointed_relieved"],
        ["\ud83d\ude2b", "\ue406", "\udbb8\udf46", "tired_face"],
        ["\ud83d\ude09", "\ue405", "\udbb8\udf47", "wink"],
        ["\ud83d\ude3a", "\ue057", "\udbb8\udf48", "smiley_cat"],
        ["\ud83d\ude38", "\ue404", "\udbb8\udf49", "smile_cat"],
        ["\ud83d\ude39", "\ue412", "\udbb8\udf4a", "joy_cat"],
        ["\ud83d\ude3d", "\ue418", "\udbb8\udf4b", "kissing_cat"],
        ["\ud83d\ude3b", "\ue106", "\udbb8\udf4c", "heart_eyes_cat"],
        ["\ud83d\ude3f", "\ue413", "\udbb8\udf4d", "crying_cat_face"],
        ["\ud83d\ude3e", "\ue416", "\udbb8\udf4e", "pouting_cat"],
        ["\ud83d\ude3c", "\ue404", "\udbb8\udf4f", "smirk_cat"],
        ["\ud83d\ude40", "\ue403", "\udbb8\udf50", "scream_cat"],
        ["\ud83d\ude45", "\ue423", "\udbb8\udf51", "no_good"],
        ["\ud83d\ude46", "\ue424", "\udbb8\udf52", "ok_woman"],
        ["\ud83d\ude47", "\ue426", "\udbb8\udf53", "bow"],
        ["\ud83d\ude48", null, "\udbb8\udf54", "see_no_evil"],
        ["\ud83d\ude4a", null, "\udbb8\udf55", "speak_no_evil"],
        ["\ud83d\ude49", null, "\udbb8\udf56", "hear_no_evil"],
        ["\ud83d\ude4b", "\ue012", "\udbb8\udf57", "raising_hand"],
        ["\ud83d\ude4c", "\ue427", "\udbb8\udf58", "raised_hands"],
        ["\ud83d\ude4d", "\ue403", "\udbb8\udf59", "person_frowning"],
        ["\ud83d\ude4e", "\ue416", "\udbb8\udf5a", "person_with_pouting_face"],
        ["\ud83d\ude4f", "\ue41d", "\udbb8\udf5b", "pray"],
        ["\ud83c\udfe0", "\ue036", "\udbb9\udcb0", "house"],
        ["\ud83c\udfe1", "\ue036", "\udbb9\udcb1", "house_with_garden"],
        ["\ud83c\udfe2", "\ue038", "\udbb9\udcb2", "office"],
        ["\ud83c\udfe3", "\ue153", "\udbb9\udcb3", "post_office"],
        ["\ud83c\udfe5", "\ue155", "\udbb9\udcb4", "hospital"],
        ["\ud83c\udfe6", "\ue14d", "\udbb9\udcb5", "bank"],
        ["\ud83c\udfe7", "\ue154", "\udbb9\udcb6", "atm"],
        ["\ud83c\udfe8", "\ue158", "\udbb9\udcb7", "hotel"],
        ["\ud83c\udfe9", "\ue501", "\udbb9\udcb8", "love_hotel"],
        ["\ud83c\udfea", "\ue156", "\udbb9\udcb9", "convenience_store"],
        ["\ud83c\udfeb", "\ue157", "\udbb9\udcba", "school"],
        ["\u26ea", "\ue037", "\udbb9\udcbb", "church"],
        ["\u26f2", "\ue121", "\udbb9\udcbc", "fountain"],
        ["\ud83c\udfec", "\ue504", "\udbb9\udcbd", "department_store"],
        ["\ud83c\udfef", "\ue505", "\udbb9\udcbe", "japanese_castle"],
        ["\ud83c\udff0", "\ue506", "\udbb9\udcbf", "european_castle"],
        ["\ud83c\udfed", "\ue508", "\udbb9\udcc0", "factory"],
        ["\u2693", "\ue202", "\udbb9\udcc1", "anchor"],
        ["\ud83c\udfee", "\ue30b", "\udbb9\udcc2", "izakaya_lantern"],
        ["\ud83d\uddfb", "\ue03b", "\udbb9\udcc3", "mount_fuji"],
        ["\ud83d\uddfc", "\ue509", "\udbb9\udcc4", "tokyo_tower"],
        ["\ud83d\uddfd", "\ue51d", "\udbb9\udcc6", "statue_of_liberty"],
        ["\ud83d\uddfe", null, "\udbb9\udcc7", "japan"],
        ["\ud83d\uddff", null, "\udbb9\udcc8", "moyai"],
        ["\ud83d\udc5e", "\ue007", "\udbb9\udccc", "mans_shoe"],
        ["\ud83d\udc5f", "\ue007", "\udbb9\udccd", "athletic_shoe"],
        ["\ud83d\udc60", "\ue13e", "\udbb9\udcd6", "high_heel"],
        ["\ud83d\udc61", "\ue31a", "\udbb9\udcd7", "sandal"],
        ["\ud83d\udc62", "\ue31b", "\udbb9\udcd8", "boot"],
        ["\ud83d\udc63", "\ue536", "\udbb9\udd53", "footprints"],
        ["\ud83d\udc53", null, "\udbb9\udcce", "eyeglasses"],
        ["\ud83d\udc55", "\ue006", "\udbb9\udccf", "shirt"],
        ["\ud83d\udc56", null, "\udbb9\udcd0", "jeans"],
        ["\ud83d\udc51", "\ue10e", "\udbb9\udcd1", "crown"],
        ["\ud83d\udc54", "\ue302", "\udbb9\udcd3", "necktie"],
        ["\ud83d\udc52", "\ue318", "\udbb9\udcd4", "womans_hat"],
        ["\ud83d\udc57", "\ue319", "\udbb9\udcd5", "dress"],
        ["\ud83d\udc58", "\ue321", "\udbb9\udcd9", "kimono"],
        ["\ud83d\udc59", "\ue322", "\udbb9\udcda", "bikini"],
        ["\ud83d\udc5a", "\ue006", "\udbb9\udcdb", "womans_clothes"],
        ["\ud83d\udc5b", null, "\udbb9\udcdc", "purse"],
        ["\ud83d\udc5c", "\ue323", "\udbb9\udcf0", "handbag"],
        ["\ud83d\udc5d", null, "\udbb9\udcf1", "pouch"],
        ["\ud83d\udcb0", "\ue12f", "\udbb9\udcdd", "moneybag"],
        ["\ud83d\udcb1", "\ue149", "\udbb9\udcde", "currency_exchange"],
        ["\ud83d\udcb9", "\ue14a", "\udbb9\udcdf", "chart"],
        ["\ud83d\udcb2", "\ue12f", "\udbb9\udce0", "heavy_dollar_sign"],
        ["\ud83d\udcb3", null, "\udbb9\udce1", "credit_card"],
        ["\ud83d\udcb4", null, "\udbb9\udce2", "yen"],
        ["\ud83d\udcb5", "\ue12f", "\udbb9\udce3", "dollar"],
        ["\ud83d\udcb8", null, "\udbb9\udce4", "money_with_wings"],
        ["\ud83c\udde8\ud83c\uddf3", "\ue513", "\udbb9\udced", "flag-cn"],
        ["\ud83c\udde9\ud83c\uddea", "\ue50e", "\udbb9\udce8", "flag-de"],
        ["\ud83c\uddea\ud83c\uddf8", "\ue511", "\udbb9\udceb", "flag-es"],
        ["\ud83c\uddeb\ud83c\uddf7", "\ue50d", "\udbb9\udce7", "flag-fr"],
        ["\ud83c\uddec\ud83c\udde7", "\ue510", "\udbb9\udcea", "flag-gb"],
        ["\ud83c\uddee\ud83c\uddf9", "\ue50f", "\udbb9\udce9", "flag-it"],
        ["\ud83c\uddef\ud83c\uddf5", "\ue50b", "\udbb9\udce5", "flag-jp"],
        ["\ud83c\uddf0\ud83c\uddf7", "\ue514", "\udbb9\udcee", "flag-kr"],
        ["\ud83c\uddf7\ud83c\uddfa", "\ue512", "\udbb9\udcec", "flag-ru"],
        ["\ud83c\uddfa\ud83c\uddf8", "\ue50c", "\udbb9\udce6", "flag-us"],
        ["\ud83d\udd25", "\ue11d", "\udbb9\udcf6", "fire"],
        ["\ud83d\udd26", null, "\udbb9\udcfb", "flashlight"],
        ["\ud83d\udd27", null, "\udbb9\udcc9", "wrench"],
        ["\ud83d\udd28", "\ue116", "\udbb9\udcca", "hammer"],
        ["\ud83d\udd29", null, "\udbb9\udccb", "nut_and_bolt"],
        ["\ud83d\udd2a", null, "\udbb9\udcfa", "hocho"],
        ["\ud83d\udd2b", "\ue113", "\udbb9\udcf5", "gun"],
        ["\ud83d\udd2e", "\ue23e", "\udbb9\udcf7", "crystal_ball"],
        ["\ud83d\udd2f", "\ue23e", "\udbb9\udcf8", "six_pointed_star"],
        ["\ud83d\udd30", "\ue209", "\udbb8\udc44", "beginner"],
        ["\ud83d\udd31", "\ue031", "\udbb9\udcd2", "trident"],
        ["\ud83d\udc89", "\ue13b", "\udbb9\udd09", "syringe"],
        ["\ud83d\udc8a", "\ue30f", "\udbb9\udd0a", "pill"],
        ["\ud83c\udd70", "\ue532", "\udbb9\udd0b", "a"],
        ["\ud83c\udd71", "\ue533", "\udbb9\udd0c", "b"],
        ["\ud83c\udd8e", "\ue534", "\udbb9\udd0d", "ab"],
        ["\ud83c\udd7e", "\ue535", "\udbb9\udd0e", "o2"],
        ["\ud83c\udf80", "\ue314", "\udbb9\udd0f", "ribbon"],
        ["\ud83c\udf81", "\ue112", "\udbb9\udd10", "gift"],
        ["\ud83c\udf82", "\ue34b", "\udbb9\udd11", "birthday"],
        ["\ud83c\udf84", "\ue033", "\udbb9\udd12", "christmas_tree"],
        ["\ud83c\udf85", "\ue448", "\udbb9\udd13", "santa"],
        ["\ud83c\udf8c", "\ue143", "\udbb9\udd14", "crossed_flags"],
        ["\ud83c\udf86", "\ue117", "\udbb9\udd15", "fireworks"],
        ["\ud83c\udf88", "\ue310", "\udbb9\udd16", "balloon"],
        ["\ud83c\udf89", "\ue312", "\udbb9\udd17", "tada"],
        ["\ud83c\udf8d", "\ue436", "\udbb9\udd18", "bamboo"],
        ["\ud83c\udf8e", "\ue438", "\udbb9\udd19", "dolls"],
        ["\ud83c\udf93", "\ue439", "\udbb9\udd1a", "mortar_board"],
        ["\ud83c\udf92", "\ue43a", "\udbb9\udd1b", "school_satchel"],
        ["\ud83c\udf8f", "\ue43b", "\udbb9\udd1c", "flags"],
        ["\ud83c\udf87", "\ue440", "\udbb9\udd1d", "sparkler"],
        ["\ud83c\udf90", "\ue442", "\udbb9\udd1e", "wind_chime"],
        ["\ud83c\udf83", "\ue445", "\udbb9\udd1f", "jack_o_lantern"],
        ["\ud83c\udf8a", null, "\udbb9\udd20", "confetti_ball"],
        ["\ud83c\udf8b", null, "\udbb9\udd21", "tanabata_tree"],
        ["\ud83c\udf91", "\ue446", "\udbb8\udc17", "rice_scene"],
        ["\ud83d\udcdf", null, "\udbb9\udd22", "pager"],
        ["\u260e", "\ue009", "\udbb9\udd23", "phone"],
        ["\ud83d\udcde", "\ue009", "\udbb9\udd24", "telephone_receiver"],
        ["\ud83d\udcf1", "\ue00a", "\udbb9\udd25", "iphone"],
        ["\ud83d\udcf2", "\ue104", "\udbb9\udd26", "calling"],
        ["\ud83d\udcdd", "\ue301", "\udbb9\udd27", "memo"],
        ["\ud83d\udce0", "\ue00b", "\udbb9\udd28", "fax"],
        ["\u2709", "\ue103", "\udbb9\udd29", "email"],
        ["\ud83d\udce8", "\ue103", "\udbb9\udd2a", "incoming_envelope"],
        ["\ud83d\udce9", "\ue103", "\udbb9\udd2b", "envelope_with_arrow"],
        ["\ud83d\udcea", "\ue101", "\udbb9\udd2c", "mailbox_closed"],
        ["\ud83d\udceb", "\ue101", "\udbb9\udd2d", "mailbox"],
        ["\ud83d\udcee", "\ue102", "\udbb9\udd2e", "postbox"],
        ["\ud83d\udcf0", null, "\udbba\udc22", "newspaper"],
        ["\ud83d\udce2", "\ue142", "\udbb9\udd2f", "loudspeaker"],
        ["\ud83d\udce3", "\ue317", "\udbb9\udd30", "mega"],
        ["\ud83d\udce1", "\ue14b", "\udbb9\udd31", "satellite"],
        ["\ud83d\udce4", null, "\udbb9\udd33", "outbox_tray"],
        ["\ud83d\udce5", null, "\udbb9\udd34", "inbox_tray"],
        ["\ud83d\udce6", "\ue112", "\udbb9\udd35", "package"],
        ["\ud83d\udce7", "\ue103", "\udbba\udf92", "e-mail"],
        ["\ud83d\udd20", null, "\udbba\udf7c", "capital_abcd"],
        ["\ud83d\udd21", null, "\udbba\udf7d", "abcd"],
        ["\ud83d\udd22", null, "\udbba\udf7e", "1234"],
        ["\ud83d\udd23", null, "\udbba\udf7f", "symbols"],
        ["\ud83d\udd24", null, "\udbba\udf80", "abc"],
        ["\u2712", null, "\udbb9\udd36", "black_nib"],
        ["\ud83d\udcba", "\ue11f", "\udbb9\udd37", "seat"],
        ["\ud83d\udcbb", "\ue00c", "\udbb9\udd38", "computer"],
        ["\u270f", "\ue301", "\udbb9\udd39", "pencil2"],
        ["\ud83d\udcce", null, "\udbb9\udd3a", "paperclip"],
        ["\ud83d\udcbc", "\ue11e", "\udbb9\udd3b", "briefcase"],
        ["\ud83d\udcbd", "\ue316", "\udbb9\udd3c", "minidisc"],
        ["\ud83d\udcbe", "\ue316", "\udbb9\udd3d", "floppy_disk"],
        ["\ud83d\udcbf", "\ue126", "\udbba\udc1d", "cd"],
        ["\ud83d\udcc0", "\ue127", "\udbba\udc1e", "dvd"],
        ["\u2702", "\ue313", "\udbb9\udd3e", "scissors"],
        ["\ud83d\udccd", null, "\udbb9\udd3f", "round_pushpin"],
        ["\ud83d\udcc3", "\ue301", "\udbb9\udd40", "page_with_curl"],
        ["\ud83d\udcc4", "\ue301", "\udbb9\udd41", "page_facing_up"],
        ["\ud83d\udcc5", null, "\udbb9\udd42", "date"],
        ["\ud83d\udcc1", null, "\udbb9\udd43", "file_folder"],
        ["\ud83d\udcc2", null, "\udbb9\udd44", "open_file_folder"],
        ["\ud83d\udcd3", "\ue148", "\udbb9\udd45", "notebook"],
        ["\ud83d\udcd6", "\ue148", "\udbb9\udd46", "book"],
        ["\ud83d\udcd4", "\ue148", "\udbb9\udd47", "notebook_with_decorative_cover"],
        ["\ud83d\udcd5", "\ue148", "\udbb9\udd02", "closed_book"],
        ["\ud83d\udcd7", "\ue148", "\udbb9\udcff", "green_book"],
        ["\ud83d\udcd8", "\ue148", "\udbb9\udd00", "blue_book"],
        ["\ud83d\udcd9", "\ue148", "\udbb9\udd01", "orange_book"],
        ["\ud83d\udcda", "\ue148", "\udbb9\udd03", "books"],
        ["\ud83d\udcdb", null, "\udbb9\udd04", "name_badge"],
        ["\ud83d\udcdc", null, "\udbb9\udcfd", "scroll"],
        ["\ud83d\udccb", "\ue301", "\udbb9\udd48", "clipboard"],
        ["\ud83d\udcc6", null, "\udbb9\udd49", "calendar"],
        ["\ud83d\udcca", "\ue14a", "\udbb9\udd4a", "bar_chart"],
        ["\ud83d\udcc8", "\ue14a", "\udbb9\udd4b", "chart_with_upwards_trend"],
        ["\ud83d\udcc9", null, "\udbb9\udd4c", "chart_with_downwards_trend"],
        ["\ud83d\udcc7", "\ue148", "\udbb9\udd4d", "card_index"],
        ["\ud83d\udccc", null, "\udbb9\udd4e", "pushpin"],
        ["\ud83d\udcd2", "\ue148", "\udbb9\udd4f", "ledger"],
        ["\ud83d\udccf", null, "\udbb9\udd50", "straight_ruler"],
        ["\ud83d\udcd0", null, "\udbb9\udd51", "triangular_ruler"],
        ["\ud83d\udcd1", "\ue301", "\udbb9\udd52", "bookmark_tabs"],
        ["\ud83c\udfbd", null, "\udbb9\udfd0", "running_shirt_with_sash"],
        ["\u26be", "\ue016", "\udbb9\udfd1", "baseball"],
        ["\u26f3", "\ue014", "\udbb9\udfd2", "golf"],
        ["\ud83c\udfbe", "\ue015", "\udbb9\udfd3", "tennis"],
        ["\u26bd", "\ue018", "\udbb9\udfd4", "soccer"],
        ["\ud83c\udfbf", "\ue013", "\udbb9\udfd5", "ski"],
        ["\ud83c\udfc0", "\ue42a", "\udbb9\udfd6", "basketball"],
        ["\ud83c\udfc1", "\ue132", "\udbb9\udfd7", "checkered_flag"],
        ["\ud83c\udfc2", null, "\udbb9\udfd8", "snowboarder"],
        ["\ud83c\udfc3", "\ue115", "\udbb9\udfd9", "runner"],
        ["\ud83c\udfc4", "\ue017", "\udbb9\udfda", "surfer"],
        ["\ud83c\udfc6", "\ue131", "\udbb9\udfdb", "trophy"],
        ["\ud83c\udfc8", "\ue42b", "\udbb9\udfdd", "football"],
        ["\ud83c\udfca", "\ue42d", "\udbb9\udfde", "swimmer"],
        ["\ud83d\ude83", "\ue01e", "\udbb9\udfdf", "railway_car"],
        ["\ud83d\ude87", "\ue434", "\udbb9\udfe0", "metro"],
        ["\u24c2", "\ue434", "\udbb9\udfe1", "m"],
        ["\ud83d\ude84", "\ue435", "\udbb9\udfe2", "bullettrain_side"],
        ["\ud83d\ude85", "\ue01f", "\udbb9\udfe3", "bullettrain_front"],
        ["\ud83d\ude97", "\ue01b", "\udbb9\udfe4", "car"],
        ["\ud83d\ude99", "\ue42e", "\udbb9\udfe5", "blue_car"],
        ["\ud83d\ude8c", "\ue159", "\udbb9\udfe6", "bus"],
        ["\ud83d\ude8f", "\ue150", "\udbb9\udfe7", "busstop"],
        ["\ud83d\udea2", "\ue202", "\udbb9\udfe8", "ship"],
        ["\u2708", "\ue01d", "\udbb9\udfe9", "airplane"],
        ["\u26f5", "\ue01c", "\udbb9\udfea", "boat"],
        ["\ud83d\ude89", "\ue039", "\udbb9\udfec", "station"],
        ["\ud83d\ude80", "\ue10d", "\udbb9\udfed", "rocket"],
        ["\ud83d\udea4", "\ue135", "\udbb9\udfee", "speedboat"],
        ["\ud83d\ude95", "\ue15a", "\udbb9\udfef", "taxi"],
        ["\ud83d\ude9a", "\ue42f", "\udbb9\udff1", "truck"],
        ["\ud83d\ude92", "\ue430", "\udbb9\udff2", "fire_engine"],
        ["\ud83d\ude91", "\ue431", "\udbb9\udff3", "ambulance"],
        ["\ud83d\ude93", "\ue432", "\udbb9\udff4", "police_car"],
        ["\u26fd", "\ue03a", "\udbb9\udff5", "fuelpump"],
        ["\ud83c\udd7f", "\ue14f", "\udbb9\udff6", "parking"],
        ["\ud83d\udea5", "\ue14e", "\udbb9\udff7", "traffic_light"],
        ["\ud83d\udea7", "\ue137", "\udbb9\udff8", "construction"],
        ["\ud83d\udea8", "\ue432", "\udbb9\udff9", "rotating_light"],
        ["\u2668", "\ue123", "\udbb9\udffa", "hotsprings"],
        ["\u26fa", "\ue122", "\udbb9\udffb", "tent"],
        ["\ud83c\udfa0", null, "\udbb9\udffc", "carousel_horse"],
        ["\ud83c\udfa1", "\ue124", "\udbb9\udffd", "ferris_wheel"],
        ["\ud83c\udfa2", "\ue433", "\udbb9\udffe", "roller_coaster"],
        ["\ud83c\udfa3", "\ue019", "\udbb9\udfff", "fishing_pole_and_fish"],
        ["\ud83c\udfa4", "\ue03c", "\udbba\udc00", "microphone"],
        ["\ud83c\udfa5", "\ue03d", "\udbba\udc01", "movie_camera"],
        ["\ud83c\udfa6", "\ue507", "\udbba\udc02", "cinema"],
        ["\ud83c\udfa7", "\ue30a", "\udbba\udc03", "headphones"],
        ["\ud83c\udfa8", "\ue502", "\udbba\udc04", "art"],
        ["\ud83c\udfa9", "\ue503", "\udbba\udc05", "tophat"],
        ["\ud83c\udfaa", null, "\udbba\udc06", "circus_tent"],
        ["\ud83c\udfab", "\ue125", "\udbba\udc07", "ticket"],
        ["\ud83c\udfac", "\ue324", "\udbba\udc08", "clapper"],
        ["\ud83c\udfad", "\ue503", "\udbba\udc09", "performing_arts"],
        ["\ud83c\udfae", null, "\udbba\udc0a", "video_game"],
        ["\ud83c\udc04", "\ue12d", "\udbba\udc0b", "mahjong"],
        ["\ud83c\udfaf", "\ue130", "\udbba\udc0c", "dart"],
        ["\ud83c\udfb0", "\ue133", "\udbba\udc0d", "slot_machine"],
        ["\ud83c\udfb1", "\ue42c", "\udbba\udc0e", "8ball"],
        ["\ud83c\udfb2", null, "\udbba\udc0f", "game_die"],
        ["\ud83c\udfb3", null, "\udbba\udc10", "bowling"],
        ["\ud83c\udfb4", null, "\udbba\udc11", "flower_playing_cards"],
        ["\ud83c\udccf", null, "\udbba\udc12", "black_joker"],
        ["\ud83c\udfb5", "\ue03e", "\udbba\udc13", "musical_note"],
        ["\ud83c\udfb6", "\ue326", "\udbba\udc14", "notes"],
        ["\ud83c\udfb7", "\ue040", "\udbba\udc15", "saxophone"],
        ["\ud83c\udfb8", "\ue041", "\udbba\udc16", "guitar"],
        ["\ud83c\udfb9", null, "\udbba\udc17", "musical_keyboard"],
        ["\ud83c\udfba", "\ue042", "\udbba\udc18", "trumpet"],
        ["\ud83c\udfbb", null, "\udbba\udc19", "violin"],
        ["\ud83c\udfbc", "\ue326", "\udbba\udc1a", "musical_score"],
        ["\u303d", "\ue12c", "\udbba\udc1b", "part_alternation_mark"],
        ["\ud83d\udcf7", "\ue008", "\udbb9\udcef", "camera"],
        ["\ud83d\udcf9", "\ue03d", "\udbb9\udcf9", "video_camera"],
        ["\ud83d\udcfa", "\ue12a", "\udbba\udc1c", "tv"],
        ["\ud83d\udcfb", "\ue128", "\udbba\udc1f", "radio"],
        ["\ud83d\udcfc", "\ue129", "\udbba\udc20", "vhs"],
        ["\ud83d\udc8b", "\ue003", "\udbba\udc23", "kiss"],
        ["\ud83d\udc8c", "\ue103\ue328", "\udbba\udc24", "love_letter"],
        ["\ud83d\udc8d", "\ue034", "\udbba\udc25", "ring"],
        ["\ud83d\udc8e", "\ue035", "\udbba\udc26", "gem"],
        ["\ud83d\udc8f", "\ue111", "\udbba\udc27", "couplekiss"],
        ["\ud83d\udc90", "\ue306", "\udbba\udc28", "bouquet"],
        ["\ud83d\udc91", "\ue425", "\udbba\udc29", "couple_with_heart"],
        ["\ud83d\udc92", "\ue43d", "\udbba\udc2a", "wedding"],
        ["\ud83d\udd1e", "\ue207", "\udbba\udf25", "underage"],
        ["\u00a9", "\ue24e", "\udbba\udf29", "copyright"],
        ["\u00ae", "\ue24f", "\udbba\udf2d", "registered"],
        ["\u2122", "\ue537", "\udbba\udf2a", "tm"],
        ["\u2139", null, "\udbba\udf47", "information_source"],
        ["\u0023\u20e3", "\ue210", "\udbba\udc2c", "hash"],
        ["\u0031\u20e3", "\ue21c", "\udbba\udc2e", "one"],
        ["\u0032\u20e3", "\ue21d", "\udbba\udc2f", "two"],
        ["\u0033\u20e3", "\ue21e", "\udbba\udc30", "three"],
        ["\u0034\u20e3", "\ue21f", "\udbba\udc31", "four"],
        ["\u0035\u20e3", "\ue220", "\udbba\udc32", "five"],
        ["\u0036\u20e3", "\ue221", "\udbba\udc33", "six"],
        ["\u0037\u20e3", "\ue222", "\udbba\udc34", "seven"],
        ["\u0038\u20e3", "\ue223", "\udbba\udc35", "eight"],
        ["\u0039\u20e3", "\ue224", "\udbba\udc36", "nine"],
        ["\u0030\u20e3", "\ue225", "\udbba\udc37", "zero"],
        ["\ud83d\udd1f", null, "\udbba\udc3b", "keycap_ten"],
        ["\ud83d\udcf6", "\ue20b", "\udbba\udc38", "signal_strength"],
        ["\ud83d\udcf3", "\ue250", "\udbba\udc39", "vibration_mode"],
        ["\ud83d\udcf4", "\ue251", "\udbba\udc3a", "mobile_phone_off"],
        ["\ud83c\udf54", "\ue120", "\udbba\udd60", "hamburger"],
        ["\ud83c\udf59", "\ue342", "\udbba\udd61", "rice_ball"],
        ["\ud83c\udf70", "\ue046", "\udbba\udd62", "cake"],
        ["\ud83c\udf5c", "\ue340", "\udbba\udd63", "ramen"],
        ["\ud83c\udf5e", "\ue339", "\udbba\udd64", "bread"],
        ["\ud83c\udf73", "\ue147", "\udbba\udd65", "egg"],
        ["\ud83c\udf66", "\ue33a", "\udbba\udd66", "icecream"],
        ["\ud83c\udf5f", "\ue33b", "\udbba\udd67", "fries"],
        ["\ud83c\udf61", "\ue33c", "\udbba\udd68", "dango"],
        ["\ud83c\udf58", "\ue33d", "\udbba\udd69", "rice_cracker"],
        ["\ud83c\udf5a", "\ue33e", "\udbba\udd6a", "rice"],
        ["\ud83c\udf5d", "\ue33f", "\udbba\udd6b", "spaghetti"],
        ["\ud83c\udf5b", "\ue341", "\udbba\udd6c", "curry"],
        ["\ud83c\udf62", "\ue343", "\udbba\udd6d", "oden"],
        ["\ud83c\udf63", "\ue344", "\udbba\udd6e", "sushi"],
        ["\ud83c\udf71", "\ue34c", "\udbba\udd6f", "bento"],
        ["\ud83c\udf72", "\ue34d", "\udbba\udd70", "stew"],
        ["\ud83c\udf67", "\ue43f", "\udbba\udd71", "shaved_ice"],
        ["\ud83c\udf56", null, "\udbba\udd72", "meat_on_bone"],
        ["\ud83c\udf65", null, "\udbba\udd73", "fish_cake"],
        ["\ud83c\udf60", null, "\udbba\udd74", "sweet_potato"],
        ["\ud83c\udf55", null, "\udbba\udd75", "pizza"],
        ["\ud83c\udf57", null, "\udbba\udd76", "poultry_leg"],
        ["\ud83c\udf68", null, "\udbba\udd77", "ice_cream"],
        ["\ud83c\udf69", null, "\udbba\udd78", "doughnut"],
        ["\ud83c\udf6a", null, "\udbba\udd79", "cookie"],
        ["\ud83c\udf6b", null, "\udbba\udd7a", "chocolate_bar"],
        ["\ud83c\udf6c", null, "\udbba\udd7b", "candy"],
        ["\ud83c\udf6d", null, "\udbba\udd7c", "lollipop"],
        ["\ud83c\udf6e", null, "\udbba\udd7d", "custard"],
        ["\ud83c\udf6f", null, "\udbba\udd7e", "honey_pot"],
        ["\ud83c\udf64", null, "\udbba\udd7f", "fried_shrimp"],
        ["\ud83c\udf74", "\ue043", "\udbba\udd80", "fork_and_knife"],
        ["\u2615", "\ue045", "\udbba\udd81", "coffee"],
        ["\ud83c\udf78", "\ue044", "\udbba\udd82", "cocktail"],
        ["\ud83c\udf7a", "\ue047", "\udbba\udd83", "beer"],
        ["\ud83c\udf75", "\ue338", "\udbba\udd84", "tea"],
        ["\ud83c\udf76", "\ue30b", "\udbba\udd85", "sake"],
        ["\ud83c\udf77", "\ue044", "\udbba\udd86", "wine_glass"],
        ["\ud83c\udf7b", "\ue30c", "\udbba\udd87", "beers"],
        ["\ud83c\udf79", "\ue044", "\udbba\udd88", "tropical_drink"],
        ["\u2197", "\ue236", "\udbba\udef0", "arrow_upper_right"],
        ["\u2198", "\ue238", "\udbba\udef1", "arrow_lower_right"],
        ["\u2196", "\ue237", "\udbba\udef2", "arrow_upper_left"],
        ["\u2199", "\ue239", "\udbba\udef3", "arrow_lower_left"],
        ["\u2934", "\ue236", "\udbba\udef4", "arrow_heading_up"],
        ["\u2935", "\ue238", "\udbba\udef5", "arrow_heading_down"],
        ["\u2194", null, "\udbba\udef6", "left_right_arrow"],
        ["\u2195", null, "\udbba\udef7", "arrow_up_down"],
        ["\u2b06", "\ue232", "\udbba\udef8", "arrow_up"],
        ["\u2b07", "\ue233", "\udbba\udef9", "arrow_down"],
        ["\u27a1", "\ue234", "\udbba\udefa", "arrow_right"],
        ["\u2b05", "\ue235", "\udbba\udefb", "arrow_left"],
        ["\u25b6", "\ue23a", "\udbba\udefc", "arrow_forward"],
        ["\u25c0", "\ue23b", "\udbba\udefd", "arrow_backward"],
        ["\u23e9", "\ue23c", "\udbba\udefe", "fast_forward"],
        ["\u23ea", "\ue23d", "\udbba\udeff", "rewind"],
        ["\u23eb", null, "\udbba\udf03", "arrow_double_up"],
        ["\u23ec", null, "\udbba\udf02", "arrow_double_down"],
        ["\ud83d\udd3a", null, "\udbba\udf78", "small_red_triangle"],
        ["\ud83d\udd3b", null, "\udbba\udf79", "small_red_triangle_down"],
        ["\ud83d\udd3c", null, "\udbba\udf01", "arrow_up_small"],
        ["\ud83d\udd3d", null, "\udbba\udf00", "arrow_down_small"],
        ["\u2b55", "\ue332", "\udbba\udf44", "o"],
        ["\u274c", "\ue333", "\udbba\udf45", "x"],
        ["\u274e", "\ue333", "\udbba\udf46", "negative_squared_cross_mark"],
        ["\u2757", "\ue021", "\udbba\udf04", "exclamation"],
        ["\u2049", null, "\udbba\udf05", "interrobang"],
        ["\u203c", null, "\udbba\udf06", "bangbang"],
        ["\u2753", "\ue020", "\udbba\udf09", "question"],
        ["\u2754", "\ue336", "\udbba\udf0a", "grey_question"],
        ["\u2755", "\ue337", "\udbba\udf0b", "grey_exclamation"],
        ["\u3030", null, "\udbba\udf07", "wavy_dash"],
        ["\u27b0", null, "\udbba\udf08", "curly_loop"],
        ["\u27bf", "\ue211", "\udbba\udc2b", "loop"],
        ["\u2764", "\ue022", "\udbba\udf0c", "heart"],
        ["\ud83d\udc93", "\ue327", "\udbba\udf0d", "heartbeat"],
        ["\ud83d\udc94", "\ue023", "\udbba\udf0e", "broken_heart"],
        ["\ud83d\udc95", "\ue327", "\udbba\udf0f", "two_hearts"],
        ["\ud83d\udc96", "\ue327", "\udbba\udf10", "sparkling_heart"],
        ["\ud83d\udc97", "\ue328", "\udbba\udf11", "heartpulse"],
        ["\ud83d\udc98", "\ue329", "\udbba\udf12", "cupid"],
        ["\ud83d\udc99", "\ue32a", "\udbba\udf13", "blue_heart"],
        ["\ud83d\udc9a", "\ue32b", "\udbba\udf14", "green_heart"],
        ["\ud83d\udc9b", "\ue32c", "\udbba\udf15", "yellow_heart"],
        ["\ud83d\udc9c", "\ue32d", "\udbba\udf16", "purple_heart"],
        ["\ud83d\udc9d", "\ue437", "\udbba\udf17", "gift_heart"],
        ["\ud83d\udc9e", "\ue327", "\udbba\udf18", "revolving_hearts"],
        ["\ud83d\udc9f", "\ue204", "\udbba\udf19", "heart_decoration"],
        ["\u2665", "\ue20c", "\udbba\udf1a", "hearts"],
        ["\u2660", "\ue20e", "\udbba\udf1b", "spades"],
        ["\u2666", "\ue20d", "\udbba\udf1c", "diamonds"],
        ["\u2663", "\ue20f", "\udbba\udf1d", "clubs"],
        ["\ud83d\udeac", "\ue30e", "\udbba\udf1e", "smoking"],
        ["\ud83d\udead", "\ue208", "\udbba\udf1f", "no_smoking"],
        ["\u267f", "\ue20a", "\udbba\udf20", "wheelchair"],
        ["\ud83d\udea9", null, "\udbba\udf22", "triangular_flag_on_post"],
        ["\u26a0", "\ue252", "\udbba\udf23", "warning"],
        ["\u26d4", "\ue137", "\udbba\udf26", "no_entry"],
        ["\u267b", null, "\udbba\udf2c", "recycle"],
        ["\ud83d\udeb2", "\ue136", "\udbb9\udfeb", "bike"],
        ["\ud83d\udeb6", "\ue201", "\udbb9\udff0", "walking"],
        ["\ud83d\udeb9", "\ue138", "\udbba\udf33", "mens"],
        ["\ud83d\udeba", "\ue139", "\udbba\udf34", "womens"],
        ["\ud83d\udec0", "\ue13f", "\udbb9\udd05", "bath"],
        ["\ud83d\udebb", "\ue151", "\udbb9\udd06", "restroom"],
        ["\ud83d\udebd", "\ue140", "\udbb9\udd07", "toilet"],
        ["\ud83d\udebe", "\ue309", "\udbb9\udd08", "wc"],
        ["\ud83d\udebc", "\ue13a", "\udbba\udf35", "baby_symbol"],
        ["\ud83d\udeaa", null, "\udbb9\udcf3", "door"],
        ["\ud83d\udeab", null, "\udbba\udf48", "no_entry_sign"],
        ["\u2714", null, "\udbba\udf49", "heavy_check_mark"],
        ["\ud83c\udd91", null, "\udbba\udf84", "cl"],
        ["\ud83c\udd92", "\ue214", "\udbba\udf38", "cool"],
        ["\ud83c\udd93", null, "\udbba\udf21", "free"],
        ["\ud83c\udd94", "\ue229", "\udbba\udf81", "id"],
        ["\ud83c\udd95", "\ue212", "\udbba\udf36", "new"],
        ["\ud83c\udd96", null, "\udbba\udf28", "ng"],
        ["\ud83c\udd97", "\ue24d", "\udbba\udf27", "ok"],
        ["\ud83c\udd98", null, "\udbba\udf4f", "sos"],
        ["\ud83c\udd99", "\ue213", "\udbba\udf37", "up"],
        ["\ud83c\udd9a", "\ue12e", "\udbba\udf32", "vs"],
        ["\ud83c\ude01", "\ue203", "\udbba\udf24", "koko"],
        ["\ud83c\ude02", "\ue228", "\udbba\udf3f", "sa"],
        ["\ud83c\ude32", null, "\udbba\udf2e", "u7981"],
        ["\ud83c\ude33", "\ue22b", "\udbba\udf2f", "u7a7a"],
        ["\ud83c\ude34", null, "\udbba\udf30", "u5408"],
        ["\ud83c\ude35", "\ue22a", "\udbba\udf31", "u6e80"],
        ["\ud83c\ude36", "\ue215", "\udbba\udf39", "u6709"],
        ["\ud83c\ude1a", "\ue216", "\udbba\udf3a", "u7121"],
        ["\ud83c\ude37", "\ue217", "\udbba\udf3b", "u6708"],
        ["\ud83c\ude38", "\ue218", "\udbba\udf3c", "u7533"],
        ["\ud83c\ude39", "\ue227", "\udbba\udf3e", "u5272"],
        ["\ud83c\ude2f", "\ue22c", "\udbba\udf40", "u6307"],
        ["\ud83c\ude3a", "\ue22d", "\udbba\udf41", "u55b6"],
        ["\u3299", "\ue315", "\udbba\udf2b", "secret"],
        ["\u3297", "\ue30d", "\udbba\udf43", "congratulations"],
        ["\ud83c\ude50", "\ue226", "\udbba\udf3d", "ideograph_advantage"],
        ["\ud83c\ude51", null, "\udbba\udf50", "accept"],
        ["\u2795", null, "\udbba\udf51", "heavy_plus_sign"],
        ["\u2796", null, "\udbba\udf52", "heavy_minus_sign"],
        ["\u2716", "\ue333", "\udbba\udf53", "heavy_multiplication_x"],
        ["\u2797", null, "\udbba\udf54", "heavy_division_sign"],
        ["\ud83d\udca0", null, "\udbba\udf55", "diamond_shape_with_a_dot_inside"],
        ["\ud83d\udca1", "\ue10f", "\udbba\udf56", "bulb"],
        ["\ud83d\udca2", "\ue334", "\udbba\udf57", "anger"],
        ["\ud83d\udca3", "\ue311", "\udbba\udf58", "bomb"],
        ["\ud83d\udca4", "\ue13c", "\udbba\udf59", "zzz"],
        ["\ud83d\udca5", null, "\udbba\udf5a", "boom"],
        ["\ud83d\udca6", "\ue331", "\udbba\udf5b", "sweat_drops"],
        ["\ud83d\udca7", "\ue331", "\udbba\udf5c", "droplet"],
        ["\ud83d\udca8", "\ue330", "\udbba\udf5d", "dash"],
        ["\ud83d\udca9", "\ue05a", "\udbb9\udcf4", "hankey"],
        ["\ud83d\udcaa", "\ue14c", "\udbba\udf5e", "muscle"],
        ["\ud83d\udcab", "\ue407", "\udbba\udf5f", "dizzy"],
        ["\ud83d\udcac", null, "\udbb9\udd32", "speech_balloon"],
        ["\u2728", "\ue32e", "\udbba\udf60", "sparkles"],
        ["\u2734", "\ue205", "\udbba\udf61", "eight_pointed_black_star"],
        ["\u2733", "\ue206", "\udbba\udf62", "eight_spoked_asterisk"],
        ["\u26aa", "\ue219", "\udbba\udf65", "white_circle"],
        ["\u26ab", "\ue219", "\udbba\udf66", "black_circle"],
        ["\ud83d\udd34", "\ue219", "\udbba\udf63", "red_circle"],
        ["\ud83d\udd35", "\ue21a", "\udbba\udf64", "large_blue_circle"],
        ["\ud83d\udd32", "\ue21a", "\udbba\udf64", "large_blue_circle"],
        ["\ud83d\udd33", "\ue21b", "\udbba\udf67", "white_square_button"],
        ["\u2b50", "\ue32f", "\udbba\udf68", "star"],
        ["\u2b1c", "\ue21b", "\udbba\udf6b", "white_large_square"],
        ["\u2b1b", "\ue21a", "\udbba\udf6c", "black_large_square"],
        ["\u25ab", "\ue21b", "\udbba\udf6d", "white_small_square"],
        ["\u25aa", "\ue21a", "\udbba\udf6e", "black_small_square"],
        ["\u25fd", "\ue21b", "\udbba\udf6f", "white_medium_small_square"],
        ["\u25fe", "\ue21a", "\udbba\udf70", "black_medium_small_square"],
        ["\u25fb", "\ue21b", "\udbba\udf71", "white_medium_square"],
        ["\u25fc", "\ue21a", "\udbba\udf72", "black_medium_square"],
        ["\ud83d\udd36", "\ue21b", "\udbba\udf73", "large_orange_diamond"],
        ["\ud83d\udd37", "\ue21b", "\udbba\udf74", "large_blue_diamond"],
        ["\ud83d\udd38", "\ue21b", "\udbba\udf75", "small_orange_diamond"],
        ["\ud83d\udd39", "\ue21b", "\udbba\udf76", "small_blue_diamond"],
        ["\u2747", "\ue32e", "\udbba\udf77", "sparkle"],
        ["\ud83d\udcae", null, "\udbba\udf7a", "white_flower"],
        ["\ud83d\udcaf", null, "\udbba\udf7b", "100"],
        ["\u21a9", null, "\udbba\udf83", "leftwards_arrow_with_hook"],
        ["\u21aa", null, "\udbba\udf88", "arrow_right_hook"],
        ["\ud83d\udd03", null, "\udbba\udf91", "arrows_clockwise"],
        ["\ud83d\udd0a", "\ue141", "\udbba\udc21", "loud_sound"],
        ["\ud83d\udd0b", null, "\udbb9\udcfc", "battery"],
        ["\ud83d\udd0c", null, "\udbb9\udcfe", "electric_plug"],
        ["\ud83d\udd0d", "\ue114", "\udbba\udf85", "mag"],
        ["\ud83d\udd0e", "\ue114", "\udbba\udf8d", "mag_right"],
        ["\ud83d\udd12", "\ue144", "\udbba\udf86", "lock"],
        ["\ud83d\udd13", "\ue145", "\udbba\udf87", "unlock"],
        ["\ud83d\udd0f", "\ue144", "\udbba\udf90", "lock_with_ink_pen"],
        ["\ud83d\udd10", "\ue144", "\udbba\udf8a", "closed_lock_with_key"],
        ["\ud83d\udd11", "\ue03f", "\udbba\udf82", "key"],
        ["\ud83d\udd14", "\ue325", "\udbb9\udcf2", "bell"],
        ["\u2611", null, "\udbba\udf8b", "ballot_box_with_check"],
        ["\ud83d\udd18", null, "\udbba\udf8c", "radio_button"],
        ["\ud83d\udd16", null, "\udbba\udf8f", "bookmark"],
        ["\ud83d\udd17", null, "\udbba\udf4b", "link"],
        ["\ud83d\udd19", "\ue235", "\udbba\udf8e", "back"],
        ["\ud83d\udd1a", null, "\udbb8\udc1a", "end"],
        ["\ud83d\udd1b", null, "\udbb8\udc19", "on"],
        ["\ud83d\udd1c", null, "\udbb8\udc18", "soon"],
        ["\ud83d\udd1d", "\ue24c", "\udbba\udf42", "top"],
        ["\u2705", null, "\udbba\udf4a", "white_check_mark"],
        ["\u270a", "\ue010", "\udbba\udf93", "fist"],
        ["\u270b", "\ue012", "\udbba\udf95", "hand"],
        ["\u270c", "\ue011", "\udbba\udf94", "v"],
        ["\ud83d\udc4a", "\ue00d", "\udbba\udf96", "facepunch"],
        ["\ud83d\udc4d", "\ue00e", "\udbba\udf97", "thumbsup"],
        ["\u261d", "\ue00f", "\udbba\udf98", "point_up"],
        ["\ud83d\udc46", "\ue22e", "\udbba\udf99", "point_up_2"],
        ["\ud83d\udc47", "\ue22f", "\udbba\udf9a", "point_down"],
        ["\ud83d\udc48", "\ue230", "\udbba\udf9b", "point_left"],
        ["\ud83d\udc49", "\ue231", "\udbba\udf9c", "point_right"],
        ["\ud83d\udc4b", "\ue41e", "\udbba\udf9d", "wave"],
        ["\ud83d\udc4f", "\ue41f", "\udbba\udf9e", "clap"],
        ["\ud83d\udc4c", "\ue420", "\udbba\udf9f", "ok_hand"],
        ["\ud83d\udc4e", "\ue421", "\udbba\udfa0", "thumbsdown"],
        ["\ud83d\udc50", "\ue422", "\udbba\udfa1", "open_hands"]
    ];

    Emoji.regUnifiedEmoji = /(?:0\u20E3|1\u20E3|2\u20E3|3\u20E3|4\u20E3|5\u20E3|6\u20E3|7\u20E3|8\u20E3|9\u20E3|#\u20E3|\*\u20E3|\uD83C(?:\uDDE6\uD83C(?:\uDDE8|\uDDE9|\uDDEA|\uDDEB|\uDDEC|\uDDEE|\uDDF1|\uDDF2|\uDDF4|\uDDF6|\uDDF7|\uDDF8|\uDDF9|\uDDFA|\uDDFC|\uDDFD|\uDDFF)|\uDDE7\uD83C(?:\uDDE6|\uDDE7|\uDDE9|\uDDEA|\uDDEB|\uDDEC|\uDDED|\uDDEE|\uDDEF|\uDDF1|\uDDF2|\uDDF3|\uDDF4|\uDDF6|\uDDF7|\uDDF8|\uDDF9|\uDDFB|\uDDFC|\uDDFE|\uDDFF)|\uDDE8\uD83C(?:\uDDE6|\uDDE8|\uDDE9|\uDDEB|\uDDEC|\uDDED|\uDDEE|\uDDF0|\uDDF1|\uDDF2|\uDDF3|\uDDF4|\uDDF5|\uDDF7|\uDDFA|\uDDFB|\uDDFC|\uDDFD|\uDDFE|\uDDFF)|\uDDE9\uD83C(?:\uDDEA|\uDDEC|\uDDEF|\uDDF0|\uDDF2|\uDDF4|\uDDFF)|\uDDEA\uD83C(?:\uDDE6|\uDDE8|\uDDEA|\uDDEC|\uDDED|\uDDF7|\uDDF8|\uDDF9|\uDDFA)|\uDDEB\uD83C(?:\uDDEE|\uDDEF|\uDDF0|\uDDF2|\uDDF4|\uDDF7)|\uDDEC\uD83C(?:\uDDE6|\uDDE7|\uDDE9|\uDDEA|\uDDEB|\uDDEC|\uDDED|\uDDEE|\uDDF1|\uDDF2|\uDDF3|\uDDF5|\uDDF6|\uDDF7|\uDDF8|\uDDF9|\uDDFA|\uDDFC|\uDDFE)|\uDDED\uD83C(?:\uDDF0|\uDDF2|\uDDF3|\uDDF7|\uDDF9|\uDDFA)|\uDDEE\uD83C(?:\uDDE8|\uDDE9|\uDDEA|\uDDF1|\uDDF2|\uDDF3|\uDDF4|\uDDF6|\uDDF7|\uDDF8|\uDDF9)|\uDDEF\uD83C(?:\uDDEA|\uDDF2|\uDDF4|\uDDF5)|\uDDF0\uD83C(?:\uDDEA|\uDDEC|\uDDED|\uDDEE|\uDDF2|\uDDF3|\uDDF5|\uDDF7|\uDDFC|\uDDFE|\uDDFF)|\uDDF1\uD83C(?:\uDDE6|\uDDE7|\uDDE8|\uDDEE|\uDDF0|\uDDF7|\uDDF8|\uDDF9|\uDDFA|\uDDFB|\uDDFE)|\uDDF2\uD83C(?:\uDDE6|\uDDE8|\uDDE9|\uDDEA|\uDDEB|\uDDEC|\uDDED|\uDDF0|\uDDF1|\uDDF2|\uDDF3|\uDDF4|\uDDF5|\uDDF6|\uDDF7|\uDDF8|\uDDF9|\uDDFA|\uDDFB|\uDDFC|\uDDFD|\uDDFE|\uDDFF)|\uDDF3\uD83C(?:\uDDE6|\uDDE8|\uDDEA|\uDDEB|\uDDEC|\uDDEE|\uDDF1|\uDDF4|\uDDF5|\uDDF7|\uDDFA|\uDDFF)|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C(?:\uDDE6|\uDDEA|\uDDEB|\uDDEC|\uDDED|\uDDF0|\uDDF1|\uDDF2|\uDDF3|\uDDF7|\uDDF8|\uDDF9|\uDDFC|\uDDFE)|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C(?:\uDDEA|\uDDF4|\uDDF8|\uDDFA|\uDDFC)|\uDDF8\uD83C(?:\uDDE6|\uDDE7|\uDDE8|\uDDE9|\uDDEA|\uDDEC|\uDDED|\uDDEE|\uDDEF|\uDDF0|\uDDF1|\uDDF2|\uDDF3|\uDDF4|\uDDF7|\uDDF8|\uDDF9|\uDDFB|\uDDFD|\uDDFE|\uDDFF)|\uDDF9\uD83C(?:\uDDE6|\uDDE8|\uDDE9|\uDDEB|\uDDEC|\uDDED|\uDDEF|\uDDF0|\uDDF1|\uDDF2|\uDDF3|\uDDF4|\uDDF7|\uDDF9|\uDDFB|\uDDFC|\uDDFF)|\uDDFA\uD83C(?:\uDDE6|\uDDEC|\uDDF2|\uDDF8|\uDDFE|\uDDFF)|\uDDFB\uD83C(?:\uDDE6|\uDDE8|\uDDEA|\uDDEC|\uDDEE|\uDDF3|\uDDFA)|\uDDFC\uD83C(?:\uDDEB|\uDDF8)|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C(?:\uDDEA|\uDDF9)|\uDDFF\uD83C(?:\uDDE6|\uDDF2|\uDDFC)))|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2648-\u2653\u2660\u2663\u2665\u2666\u2668\u267B\u267F\u2692-\u2694\u2696\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD79\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED0\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3]|\uD83E[\uDD10-\uDD18\uDD80-\uDD84\uDDC0]/g;
    Emoji.regSoftbankEmoji = /\uE415\uE331|\uE103\uE328|\uE04A\uE049|[\uE001-\uE05A\uE101-\uE15A\uE201-\uE253\uE301-\uE34D\uE401-\uE44C\uE501-\uE537]/g;

    Emoji.Map.unified = Emoji.Map.map(function(item){return item[0]});
    Emoji.Map.google = Emoji.Map.map(function(item){return item[0]});
    Emoji.Map.softbank = Emoji.Map.map(function(item){return item[1]});
    Emoji.Map.ennames = Emoji.Map.map(function(item){return item[3]});

    Emoji.regQQFace = /\/::\)|\/::~|\/::B|\/::\||\/:8-\)|\/::<|\/::\$|\/::X|\/::Z|\/::'\(|\/::-\||\/::@|\/::P|\/::D|\/::O|\/::\(|\/::\+|\/:--b|\/::Q|\/::T|\/:,@P|\/:,@-D|\/::d|\/:,@o|\/::g|\/:\|-\)|\/::!|\/::L|\/::>|\/::,@|\/:,@f|\/::-S|\/:\?|\/:,@x|\/:,@@|\/::8|\/:,@!|\/:!!!|\/:xx|\/:bye|\/:wipe|\/:dig|\/:handclap|\/:&-\(|\/:B-\)|\/:<@|\/:@>|\/::-O|\/:>-\||\/:P-\(|\/::'\||\/:X-\)|\/::\*|\/:@x|\/:8\*|\/:pd|\/:<W>|\/:beer|\/:basketb|\/:oo|\/:coffee|\/:eat|\/:pig|\/:rose|\/:fade|\/:showlove|\/:heart|\/:break|\/:cake|\/:li|\/:bome|\/:kn|\/:footb|\/:ladybug|\/:shit|\/:moon|\/:sun|\/:gift|\/:hug|\/:strong|\/:weak|\/:share|\/:v|\/:@\)|\/:jj|\/:@@|\/:bad|\/:lvu|\/:no|\/:ok|\/:love|\/:<L>|\/:jump|\/:shake|\/:<O>|\/:circle|\/:kotow|\/:turn|\/:skip|\/:oY|\/:#-0|\/:hiphot|\/:kiss|\/:<&|\/:&>/g;
    Emoji.QQFace = [
        ["/::)", "微笑"],
        ["/::~", "伤心"],
        ["/::B", "美女"],
        ["/::|", "发呆"],
        ["/:8-)", "墨镜"],
        ["/::<", "哭"],
        ["/::$", "羞"],
        ["/::X", "哑"],
        ["/::Z", "睡"],
        ["/::'(", "哭"],
        ["/::-|", "囧"],
        ["/::@", "怒"],
        ["/::P", "调皮"],
        ["/::D", "笑"],
        ["/::O", "惊讶"],
        ["/::(", "难过"],
        ["/::+", "酷"],
        ["/:--b", "汗"],
        ["/::Q", "抓狂"],
        ["/::T", "吐"],
        ["/:,@P", "笑"],
        ["/:,@-D", "快乐"],
        ["/::d", "奇"],
        ["/:,@o", "傲"],
        ["/::g", "饿"],
        ["/:|-)", "累"],
        ["/::!", "吓"],
        ["/::L", "汗"],
        ["/::>", "高兴"],
        ["/::,@", "闲"],
        ["/:,@f", "努力"],
        ["/::-S", "骂"],
        ["/:?", "疑问"],
        ["/:,@x", "秘密"],
        ["/:,@@", "乱"],
        ["/::8", "疯"],
        ["/:,@!", "哀"],
        ["/:!!!", "鬼"],
        ["/:xx", "打击"],
        ["/:bye", "bye"],
        ["/:wipe", "汗"],
        ["/:dig", "抠"],
        ["/:handclap", "鼓掌"],
        ["/:&-(", "糟糕"],
        ["/:B-)", "恶搞"],
        ["/:<@", "什么"],
        ["/:@>", "什么"],
        ["/::-O", "累"],
        ["/:>-|", "看"],
        ["/:P-(", "难过"],
        ["/::'|", "难过"],
        ["/:X-)", "坏"],
        ["/::*", "亲"],
        ["/:@x", "吓"],
        ["/:8*", "可怜"],
        ["/:pd", "刀"],
        ["/:<W>", "水果"],
        ["/:beer", "酒"],
        ["/:basketb", "篮球"],
        ["/:oo", "乒乓"],
        ["/:coffee", "咖啡"],
        ["/:eat", "美食"],
        ["/:pig", "动物"],
        ["/:rose", "鲜花"],
        ["/:fade", "枯"],
        ["/:showlove", "唇"],
        ["/:heart", "爱"],
        ["/:break", "分手"],
        ["/:cake", "生日"],
        ["/:li", "电"]
    ];
    Emoji.Map.qq_face = Emoji.QQFace.map(function(item){return item[0]});
    Emoji.Map.qq_facename = Emoji.QQFace.map(function(item){return item[1]});

    // export
    Root.Emoji = Emoji;

})(this);