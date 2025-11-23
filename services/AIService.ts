import { PickupRequest } from '../types';
import { FirebasePickupRequest } from './firebaseService';

export interface AIInsight {
    type: 'prediction' | 'anomaly';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    location?: string;
}

export class AIService {
    // Analyze requests to find anomalies (e.g., unusually high quantities)
    static detectAnomalies(requests: (PickupRequest | FirebasePickupRequest)[]): AIInsight[] {
        const insights: AIInsight[] = [];
        const quantityThreshold = 50; // Arbitrary threshold for "high quantity"

        requests.forEach(req => {
            const totalQuantity = req.items.reduce((sum, item) => sum + item.quantity, 0);

            if (totalQuantity > quantityThreshold) {
                insights.push({
                    type: 'anomaly',
                    title: 'Quantité Inhabituelle Détectée',
                    description: `La demande du ${new Date(req.date).toLocaleDateString()} pour ${req.location} contient ${totalQuantity} articles, ce qui est supérieur à la normale.`,
                    severity: 'medium',
                    location: req.location
                });
            }
        });

        // Return only the most recent anomalies
        return insights.slice(0, 3);
    }

    // Predict which locations might need a pickup soon based on frequency
    static predictUpcomingPickups(requests: (PickupRequest | FirebasePickupRequest)[]): AIInsight[] {
        const insights: AIInsight[] = [];
        const locationLastPickup: Record<string, Date> = {};
        const locationFrequency: Record<string, number[]> = {};

        // 1. Calculate intervals between pickups for each location
        // Sort requests by date
        const sortedRequests = [...requests].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        sortedRequests.forEach(req => {
            const loc = req.location.split(',')[0].trim();
            const date = new Date(req.date);

            if (locationLastPickup[loc]) {
                const diffTime = Math.abs(date.getTime() - locationLastPickup[loc].getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (!locationFrequency[loc]) locationFrequency[loc] = [];
                locationFrequency[loc].push(diffDays);
            }
            locationLastPickup[loc] = date;
        });

        // 2. Predict next pickup
        const today = new Date();
        Object.entries(locationLastPickup).forEach(([loc, lastDate]) => {
            const frequencies = locationFrequency[loc];
            if (frequencies && frequencies.length > 0) {
                const avgInterval = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;
                const daysSinceLast = Math.ceil((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

                // If days since last pickup is close to average interval (within 20%)
                if (daysSinceLast >= avgInterval * 0.8) {
                    insights.push({
                        type: 'prediction',
                        title: 'Collecte Anticipée',
                        description: `${loc} pourrait nécessiter une collecte bientôt. Moyenne: tous les ${Math.round(avgInterval)} jours.`,
                        severity: 'low',
                        location: loc
                    });
                }
            }
        });

        return insights;
    }

    static getInsights(requests: (PickupRequest | FirebasePickupRequest)[]): AIInsight[] {
        const anomalies = this.detectAnomalies(requests);
        const predictions = this.predictUpcomingPickups(requests);
        return [...anomalies, ...predictions];
    }
}
