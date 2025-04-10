import { Injectable } from "@angular/core"

@Injectable({
    providedIn: "root",
})
export class AnsiService {
    
    private colors: Record<string, string> = {
        "0": "color: #dee2e6", 
        "1": "color: #e74c3c", 
        "2": "color: #2ecc71", 
        "3": "color: #e9c46a", 
        "4": "color: #3498db", 
        "5": "color: #9b59b6", 
        "6": "color: #2a9d8f", 
        "7": "color: #f8f9fa", 
        "30": "color: #343a40", 
        "31": "color: #e74c3c", 
        "32": "color: #2ecc71", 
        "33": "color: #e9c46a", 
        "34": "color: #3498db", 
        "35": "color: #9b59b6", 
        "36": "color: #2a9d8f", 
        "37": "color: #f8f9fa", 
        "90": "color: #6c757d", 
        "91": "color: #ff6b6b", 
        "92": "color: #51cf66", 
        "93": "color: #ffd43b", 
        "94": "color: #4dabf7", 
        "95": "color: #cc5de8", 
        "96": "color: #22b8cf", 
        "97": "color: #ffffff", 
        "40": "background-color: #343a40", 
        "41": "background-color: #e74c3c", 
        "42": "background-color: #2ecc71", 
        "43": "background-color: #e9c46a", 
        "44": "background-color: #3498db", 
        "45": "background-color: #9b59b6", 
        "46": "background-color: #2a9d8f", 
        "47": "background-color: #f8f9fa", 
        "100": "background-color: #6c757d", 
        "101": "background-color: #ff6b6b", 
        "102": "background-color: #51cf66", 
        "103": "background-color: #ffd43b", 
        "104": "background-color: #4dabf7", 
        "105": "background-color: #cc5de8", 
        "106": "background-color: #22b8cf", 
        "107": "background-color: #ffffff", 
    }

    private styles: Record<string, string> = {
        "0": "", 
        "1": "font-weight: bold", 
        "2": "opacity: 0.8", 
        "3": "font-style: italic", 
        "4": "text-decoration: underline", 
        "5": "animation: blink 1s step-end infinite", 
        "7": "filter: invert(100%)", 
        "8": "opacity: 0", 
        "9": "text-decoration: line-through", 
        "22": "font-weight: normal", 
        "23": "font-style: normal", 
        "24": "text-decoration: none", 
        "25": "animation: none", 
        "27": "filter: none", 
        "28": "opacity: 1", 
        "29": "text-decoration: none", 
    }

    constructor() { }

    ansiToHtml(text: string): string {
        if (!text) return ""

        
        const ansiPattern = /\u001b\[([;\d]+)m/g
        let result = ""
        let lastIndex = 0
        let match
        let currentStyles: string[] = []

        
        while ((match = ansiPattern.exec(text)) !== null) {
            
            result += this.escapeHtml(text.substring(lastIndex, match.index))
            lastIndex = match.index + match[0].length

            
            const codes = match[1].split(";")
            for (const code of codes) {
                if (code === "0") {
                    
                    currentStyles = []
                } else if (this.colors[code]) {
                    
                    currentStyles = currentStyles.filter(
                        (style) => !style.startsWith("color:") && !style.startsWith("background-color:"),
                    )
                    currentStyles.push(this.colors[code])
                } else if (this.styles[code]) {
                    
                    const styleType = this.styles[code].split(":")[0]
                    currentStyles = currentStyles.filter((style) => !style.startsWith(`${styleType}:`))
                    if (this.styles[code]) {
                        currentStyles.push(this.styles[code])
                    }
                }
            }
        }

        
        result += this.escapeHtml(text.substring(lastIndex))

        
        if (currentStyles.length > 0) {
            const styleAttr = currentStyles.join("; ")
            result = `<span style="${styleAttr}">${result}</span>`
        }

        return result
    }

    processLogs(logs: string[]): string {
        if (!logs || logs.length === 0) return ""

        let result = logs
            .map((line, index) => {
                const processedLine = this.ansiToHtml(line)
                return `<div class="log-line" id="log-line-${index}">${processedLine}</div>`
            })
            .join("")

        
        result += '<div id="log-end-marker" style="height: 1px; width: 100%;"></div>'

        return result
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
    }
}
