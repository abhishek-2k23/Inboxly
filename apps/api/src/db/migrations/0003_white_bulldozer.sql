CREATE TABLE "calendar_watch_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"calendar_id" text DEFAULT 'primary' NOT NULL,
	"channel_id" text NOT NULL,
	"resource_id" text NOT NULL,
	"expiration" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "calendar_watch_state_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "calendar_watch_state_channel_id_unique" UNIQUE("channel_id")
);
--> statement-breakpoint
ALTER TABLE "calendar_watch_state" ADD CONSTRAINT "calendar_watch_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;