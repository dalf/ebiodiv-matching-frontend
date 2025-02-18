import axios from 'axios';

export default new class Backend {

    constructor() {
        this.urls = null;
        this.sendingRequest = false;
        this.pendingPromiseResolve = [];
        this.pendingPromiseReject = [];
    }

    fetch_urls() {
        return new Promise((resolve, reject) => {
            if (this.urls !== null) {
                resolve();
                return
            }
            if (this.sendingRequest === true) {
                this.pendingPromiseResolve.push(resolve)
                this.pendingPromiseReject.push(reject)
                return
            }
            this.sendingRequest = true;
            axios
                .get(process.env.BASE_URL + 'backend.json')
                .then((response) => {
                    this.urls = response.data;
                    this.sendingRequest = false;
                    resolve();
                    this.pendingPromiseResolve.forEach(resolve => resolve())
                })
                .catch(error => {
                    reject(error)
                    this.pendingPromiseReject.forEach(reject => reject())
                })
        })
    }

    async axios_get(url) {
        return await axios.get(url, { validateStatus: (status) => { return status == 200 } })
    }

    async fetch_institutions() {
        await this.fetch_urls()
        return await this.axios_get(this.urls.institutions)
    }

    async fetch_occurrences_from_q(user_query) {
        await this.fetch_urls()
        var url = this.urls.search + "?" + this.fillQuery(user_query) + "&limit=" + user_query.limit + "&offset=" + ((user_query.page-1)*20)
        return await this.axios_get(url)
    }

    async fetch_occurrences_from_occurrencekeys(occurrencekeys) {
        await this.fetch_urls()
        var url = this.urls.occurrencesList + "?occurrenceKeys=" + occurrencekeys.join(",")
        return await this.axios_get(url)
    }

    async fetch_next_occurrence_from_q(user_query, occurrence_key) {
        await this.fetch_urls()
        var url = this.urls.occurrences + "/" + occurrence_key + "/next?" + this.fillQuery(user_query)

        return await this.axios_get(url)
    }

    async fetch_occurrence(occurenceKey, fetch_missing) {
        await this.fetch_urls()
        var url = this.urls.occurrences + "?occurrenceKeys=" + occurenceKey
        if (fetch_missing) {
            url = url + "&fetchMissing=true"
        }
        return await this.axios_get(url)
    }

    async fetch_facet_values(field, user_query, limit, offset) {
        await this.fetch_urls()
        var url = this.urls.facet + "?field=" + field + this.fillQuery(user_query, field) + "&limit=" + (limit+1) + "&offset=" + offset
        return await this.axios_get(url)
    }

    async fetch_facet_values_with_keywords(field, pre_value, user_query, limit, offset) {
        await this.fetch_urls()
        var url = this.urls.facet + "?field=" + field + this.fillQuery(user_query, field) + "&limit=" + limit + "&offset="+offset +"&" + field + "=" + pre_value
        return await this.axios_get(url)
    }

    async fetch_status_code() {
        await this.fetch_urls()
        var url = this.urls.statusCode
        return await this.axios_get(url)
    }

    async post_comment(data) {
        await this.fetch_urls()
        return await axios.post(this.urls.comments, data)
    }

    async fetch_comments(key1, key2=null) {
        await this.fetch_urls()
        var url = this.urls.comments + "?" + "occKey1=" + key1
        if (key2 != null){
            url += "&occKey2=" + key2
        } 
        return await this.axios_get(url)
    }

    async post_matching(data) {
        await this.fetch_urls()
        return await axios.post(this.urls.matching, data)
    }
    
    async post_sib_matching(data) {
        let sib_backend_url = process.env.VUE_APP_SIB_BACKEND_URL;
        if (sib_backend_url == null || sib_backend_url == "") {
            await this.fetch_urls()
            sib_backend_url = this.urls.sib_backend_url
        }
        if (sib_backend_url != null) {
            return await axios.post(sib_backend_url + "newOcurrenceRelations", data)
        }
    }

    fillQuery(user_query, type=''){

        var query = "&basisOfRecord=" + user_query.basisOfRecord + "&ranking=" + user_query.ranking

        if (user_query.q != ""){
            query += "&q=" + user_query.q
        }
        for (const [name, values] of Object.entries(user_query.facets_selection)) {
            if (name != type){
                if(values.length > 0){
                    if (name == 'year'){
                        query += "&" +name + "=" + values.join(",")
                    }
                    else if (name == 'hasRelationWithStatus'){
                        var yes = false
                        var no = false
                        for (let i=0; i<values.length; i++){
                            if (name == "hasRelationWithStatus" & values[i] == "Done (YES)"){
                                yes = true
                            }
                            else if (name == "hasRelationWithStatus" & values[i] == "Done (NO)"){
                                no = true
                            }
                            else {
                                query += "&" + name + "=" + encodeURIComponent(values[i]);
                            }
                        }
                        if (yes || no){
                            query += "&" + name + "=" + encodeURIComponent("DONE");                           
                        }
                        if (yes && !no){
                            query += "&hasRelationWithVote=" + encodeURIComponent("YES");
                        }
                        else if (no && !yes){
                            query += "&hasRelationWithVote=" + encodeURIComponent("NO");
                        }
                    }
                    else {
                        for (let i=0; i<values.length; i++){
                            var fieldName = name
                            query += "&" + fieldName + "=" + encodeURIComponent(values[i]);
                            
                        }
                    }
                    
                }
            }
            
        }
        return query

    }
   
}