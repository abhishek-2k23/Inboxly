CREATE TABLE "calendar_ai_meta" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"entity_id" text NOT NULL,
	"embedding" vector(1536),
	"content_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "calendar_ai_meta_entity_id_unique" UNIQUE("entity_id")
);
--> statement-breakpoint
ALTER TABLE "calendar_ai_meta" ADD CONSTRAINT "calendar_ai_meta_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_calendar_ai_meta_embedding" ON "calendar_ai_meta" USING hnsw ("embedding" vector_cosine_ops);