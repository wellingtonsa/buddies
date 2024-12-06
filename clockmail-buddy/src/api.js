function mountURL(workspaceId, path){
    return `${process.env.CLOCKIFY_URL}/${workspaceId}/${path}`
}


exports.default = {
    DETAIL_REPORT: "reports/detailed",
    mountURL
}