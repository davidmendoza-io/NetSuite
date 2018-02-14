//Execution Logs
function LogExec(title, details) {
    var context = nlapiGetContext(),
        usageRemaining = context.getRemainingUsage();
    nlapiLogExecution('DEBUG', title + ' || Units Left => ' + usageRemaining, details);
}

//Stringify Execution Logs
function LogExecStringify(title, details) {
    var context = nlapiGetContext();
    var usageRemaining = context.getRemainingUsage();
    nlapiLogExecution('DEBUG', title + ' || Units Left => ' + usageRemaining, JSON.stringify(details));
}

//Log Errors
function LogError(title, details) {
    var context = nlapiGetContext();
    var usageRemaining = context.getRemainingUsage();
    nlapiLogExecution('ERROR', title + ' || Units Left => ' + usageRemaining, details);
}

//Stringify Error Logs
function LogErrorStringify(title, details) {
    var context = nlapiGetContext();
    var usageRemaining = context.getRemainingUsage();
    nlapiLogExecution('ERROR', title + ' || Units Left => ' + usageRemaining, JSON.stringify(details));
}

//returns if sandbox or production and account id
function GetEnvironment() {
    var context = nlapiGetContext();
    var environment = context.getEnvironment();
    var accountId = context.getCompany();
    return {
        environment: environment,
        accountId: accountId
    }
}

//call nlapiYieldScript for Schdeule Scripts
function CheckGovernance(from, num) {
    var context = nlapiGetContext();
    if (context.getRemainingUsage() < 10000) {
        var state = nlapiYieldScript();
        if (state.status == 'FAILURE') {
            LogError(num + ' <checkGovernance FAILURE> ' + from, 'Failed to yield script, exiting: Reason = ' + state.reason + ' / Size = ' + state.size);
            throw 'Failed to yield script';
        } else if (state.status == 'RESUME') {}
    }
}

//set recovery points for schedule scripts
function SetRecoveryPoint(from, num) {
    //100 point governance
    var state = nlapiSetRecoveryPoint();
    //we successfully create a new recovery point
    if (state.status == 'SUCCESS') return;
    //a recovery point was previously set, we are resuming due to some unforeseen error
    if (state.status == 'RESUME') {
        LogError(num + ' <setRecoveryPoint RESUME> ' + from, 'Resuming script because of ' + state.reason + '.  Size = ' + state.size);
        HandleRecoveryFailure(state);
    } else if (state.status == 'FAILURE') {
        //we failed to create a new recovery point
        LogError(num + ' <setRecoveryPoint FAILURE> ' + from, 'Failed to create recovery point. Reason = ' + state.reason + ' / Size = ' + state.size);
        HandleRecoveryFailure(state);
    }
}

//handle recovery point failure from schedueld script
function HandleRecoveryFailure(failure) {
    if (failure.reason == 'SS_MAJOR_RELEASE') throw 'Major Update of NetSuite in progress, shutting down all processes';
    if (failure.reason == 'SS_CANCELLED') throw 'Script Cancelled due to UI interaction';
    if (failure.reason == 'SS_EXCESSIVE_MEMORY_FOOTPRINT') {
        // cleanUpMemory();
        setRecoveryPoint('handleRecoveryFailure');
    } //avoid infinite loop
    if (failure.reason == 'SS_DISALLOWED_OBJECT_REFERENCE') throw 'Could not set recovery point because of a reference to a non-recoverable object: ' + failure.information;
}

function AddCommasToDollars(number) {
    return Number(number).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

//add commas to any number returns as string
function AddCommas(number) {
    return Number(number).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

//Returns current time of user's machine
function GetTime() {
    var date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    var strTime = hours + ':' + minutes + ':' + seconds + ' ' + ampm;
    return strTime;
}

//Rounds number to given deceimal places, returns rounded number
function RoundValue(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

//Check if variable is null or empty, return true or false
function IsNullOrEmpty(objVariable) {
    return (objVariable == null || objVariable == "" || objVariable == undefined);
}

//Searches for string inside of string, returns true or false
function Contains(str, search) {
    return str.indexOf(search) >= 0;
}

//Sorts array of objects by 2 keys, returns sorted object
function ObjSort() {
    //can be called by 
    //var x  = ObjSort(items, 'property1', 'property2');
    var args = arguments,
        array = args[0],
        case_sensitive, keys_length, key, desc, a, b, i;

    if (typeof arguments[arguments.length - 1] === 'boolean') {
        case_sensitive = arguments[arguments.length - 1];
        keys_length = arguments.length - 1;
    } else {
        case_sensitive = false;
        keys_length = arguments.length;
    }

    return array.sort(function(obj1, obj2) {
        for (i = 1; i < keys_length; i++) {
            key = args[i];
            if (typeof key !== 'string') {
                desc = key[1];
                key = key[0];
                a = obj1[args[i][0]];
                b = obj2[args[i][0]];
            } else {
                desc = false;
                a = obj1[args[i]];
                b = obj2[args[i]];
            }
            if (case_sensitive === false && typeof a === 'string') {
                a = a.toLowerCase();
                b = b.toLowerCase();
            }
            if (!desc) {
                if (a < b) return -1;
                if (a > b) return 1;
            } else {
                if (a > b) return -1;
                if (a < b) return 1;
            }
        }
        return 0;
    });
}

//sha256 encoding
function SHA256(s) {
    var chrsz = 8;
    var hexcase = 0;

    function safe_add(x, y) {
        var lsw = (x & 0xFFFF) + (y & 0xFFFF);
        var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    }

    function S(X, n) {
        return (X >>> n) | (X << (32 - n));
    }

    function R(X, n) {
        return (X >>> n);
    }

    function Ch(x, y, z) {
        return ((x & y) ^ ((~x) & z));
    }

    function Maj(x, y, z) {
        return ((x & y) ^ (x & z) ^ (y & z));
    }

    function Sigma0256(x) {
        return (S(x, 2) ^ S(x, 13) ^ S(x, 22));
    }

    function Sigma1256(x) {
        return (S(x, 6) ^ S(x, 11) ^ S(x, 25));
    }

    function Gamma0256(x) {
        return (S(x, 7) ^ S(x, 18) ^ R(x, 3));
    }

    function Gamma1256(x) {
        return (S(x, 17) ^ S(x, 19) ^ R(x, 10));
    }

    function core_sha256(m, l) {
        var K = new Array(0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786, 0xFC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x6CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2);
        var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);
        var W = new Array(64);
        var a, b, c, d, e, f, g, h, i, j;
        var T1, T2;
        m[l >> 5] |= 0x80 << (24 - l % 32);
        m[((l + 64 >> 9) << 4) + 15] = l;
        for (var i = 0; i < m.length; i += 16) {
            a = HASH[0];
            b = HASH[1];
            c = HASH[2];
            d = HASH[3];
            e = HASH[4];
            f = HASH[5];
            g = HASH[6];
            h = HASH[7];
            for (var j = 0; j < 64; j++) {
                if (j < 16) W[j] = m[j + i];
                else W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);
                T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
                T2 = safe_add(Sigma0256(a), Maj(a, b, c));
                h = g;
                g = f;
                f = e;
                e = safe_add(d, T1);
                d = c;
                c = b;
                b = a;
                a = safe_add(T1, T2);
            }
            HASH[0] = safe_add(a, HASH[0]);
            HASH[1] = safe_add(b, HASH[1]);
            HASH[2] = safe_add(c, HASH[2]);
            HASH[3] = safe_add(d, HASH[3]);
            HASH[4] = safe_add(e, HASH[4]);
            HASH[5] = safe_add(f, HASH[5]);
            HASH[6] = safe_add(g, HASH[6]);
            HASH[7] = safe_add(h, HASH[7]);
        }
        return HASH;
    }

    function str2binb(str) {
        var bin = Array();
        var mask = (1 << chrsz) - 1;
        for (var i = 0; i < str.length * chrsz; i += chrsz) {
            bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i % 32);
        }
        return bin;
    }

    function Utf8Encode(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    }

    function binb2hex(binarray) {
        var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
        var str = "";
        for (var i = 0; i < binarray.length * 4; i++) {
            str += hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xF) +
                hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8)) & 0xF);
        }
        return str;
    }
    s = Utf8Encode(s);
    return binb2hex(core_sha256(str2binb(s), s.length * chrsz));
}