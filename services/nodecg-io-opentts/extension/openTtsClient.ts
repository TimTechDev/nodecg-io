import { OpenTTSConfig } from "./index";
import { ObjectMap } from "nodecg-io-core/extension/service";
import fetch, { Response } from "node-fetch";

type OpenTTSName = "espeak" | "flite" | "festival" | "nanotts" | "marytts";
type OpenTTSGender = "F" | "M";
type OpenTTVOCoderQuality = "high" | "medium" | "low";

export interface OpenTTSVoice {
    gender: OpenTTSGender;
    id: string;
    language: string;
    locale: string;
    multispeaker: boolean;
    name: string;
    speakers?: ObjectMap<number>;
    tag: ObjectMap<unknown>;
    tts_name: string;
}

export class OpenTTSClient {
    constructor(private config: OpenTTSConfig) {}

    private buildBaseURL(): string {
        const protocol = this.config.useHttps ? "https" : "http";
        return `${protocol}://${this.config.host}`;
    }

    private async executeRequest(path: string): Promise<Response> {
        const response = await fetch(this.buildBaseURL() + path);
        if (!response.ok) {
            throw new Error("Failed to execute opentts request: " + (await response.text()));
        }

        return response;
    }

    async getLanguages(ttsName?: OpenTTSName): Promise<Array<string>> {
        const urlVar = ttsName ? `?tts_name=${ttsName}` : "";
        const response = await this.executeRequest(`/api/languages${urlVar}`);
        return await response.json();
    }

    async getVoices(
        language?: string,
        locale?: string,
        gender?: OpenTTSGender,
        ttsName?: OpenTTSName,
    ): Promise<ObjectMap<OpenTTSVoice>> {
        const params = new URLSearchParams();
        if (language) params.set("language", language);
        if (locale) params.set("locale", locale);
        if (gender) params.set("gender", gender);
        if (ttsName) params.set("tts_name", ttsName);

        const response = await this.executeRequest(`/api/voices?${params}`);
        return await response.json();
    }

    generateWavUrl(
        text: string,
        voice: string,
        vocoder?: OpenTTVOCoderQuality,
        denoiserStrength?: number,
        cache?: boolean,
    ): string {
        const params = new URLSearchParams({ text, voice });
        if(vocoder) params.set("vocoder", vocoder);
        if(denoiserStrength) params.set("denoiserStrength", denoiserStrength.toString());
        if(cache !== undefined) params.set("cache", cache.toString());

        return `${this.buildBaseURL()}/api/tts?${params}`;
    }

    async getWavData(url: string): Promise<ArrayBuffer> {
        const response = await this.executeRequest(url);
        return await response.arrayBuffer();
    }

    static async isOpenTTSAvailable(config: OpenTTSConfig): Promise<boolean> {
        try {
            await new OpenTTSClient(config).getLanguages();
            return true;
        } catch (_e) {
            return false;
        }
    }
}
