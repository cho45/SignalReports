#!/usr/bin/env perl

use v5.12;
use LWP::UserAgent;
use LWP::Protocol::https;
use URI;
use JSON;
use HTTP::Request::Common;
use Script::State;
use File::Temp;
use DateTime;
use DBI;
use DBD::SQLite;
use Path::Class;
use Config::Pit;
use Text::Xslate;
use Log::Minimal;

my $config = pit_get('signalreports', require => {
	dropbox_client_id     => '',
	dropbox_client_secret => '',
	public_root           => '',
});

my $ua = LWP::UserAgent->new(ssl_opts => { verify_hostname => 1 });

script_state my $state = {};

if (!$state->{oauth}) {
	infof "Require authorization";
	my $authorize_uri = URI->new('https://www.dropbox.com/1/oauth2/authorize');
	$authorize_uri->query_form(
		response_type => 'code',
		client_id     => $config->{dropbox_client_id},
		redirect_uri  => 'http://localhost/oob',
	);

	use Data::Dumper;
	say $authorize_uri; ;

	my $code = <>;
	chomp $code;

	my $token_uri = URI->new('https://www.dropbox.com/1/oauth2/token');

	my $res = $ua->post($token_uri, {
		code          => $code,
		grant_type    => 'authorization_code',
		client_id     => $config->{dropbox_client_id},
		client_secret => $config->{dropbox_client_secret},
		redirect_uri  => 'http://localhost/oob',
	});

	use Data::Dumper;
	warn Dumper $res ;

	$state->{oauth} = decode_json $res->content ;
}

infof "Download log DB";
my $req = GET 'https://api-content.dropbox.com/1/files/dropbox/project/SignalReports/data.db';
$req->header('Authorization' => 'Bearer ' . $state->{oauth}->{access_token});

my $res = $ua->request($req);

my $fh = File::Temp->new;
print $fh $res->content;
close $fh;

my $dbh = DBI->connect("dbi:SQLite:dbname=" . $fh->filename, "", "");

my $rows = $dbh->selectall_arrayref(q{
	SELECT
		callsign,
		frequency,
		mode,
		ur_rst,
		datetime
	FROM entries 
	ORDER BY datetime DESC
	},
	{ Slice => {} }
);

my $data = {};
for my $row (@$rows) {
	my $dt = DateTime->from_epoch(epoch => $row->{datetime}, time_zone => 'Asia/Tokyo');
	$data->{$dt->year} ||= [];

	if (!$data->{$dt->year}->[-1] || $data->{$dt->year}->[-1]->{date} ne $dt->ymd) {
		push @{ $data->{$dt->year} }, {
			date => $dt->ymd,
			rows => [],
		};
	}

	push @{ $data->{$dt->year}->[-1]->{rows} }, $row;
}

use Data::Dumper;
warn Dumper $data ;

my $xslate = Text::Xslate->new(
	syntax => 'TTerse',
);

for my $year (keys %$data) {
	my $result = $xslate->render('scripts/publish.html', {
		year => $year,
		data => $data->{$year},
	});
	my $file = dir($config->{public_root})->subdir($year)->file("signalreports.html");
	infof "Output to %s", $file;
	my $fh = $file->openw;
	print $fh $result;
	close $fh;
}

