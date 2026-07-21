use soroban_sdk::Bytes;

const MAX_DOMAIN_LEN: u32 = 255;
const MAX_LABEL_LEN: u32 = 63;

/// Validates that `domain` looks like a plausible anchor domain (the kind of
/// hostname an off-chain attestor would publish a `stellar.toml` under).
///
/// This is a syntactic check only -- it does not resolve DNS or fetch
/// anything off-chain. It rejects empty/oversized input, disallowed
/// characters, empty labels (leading/trailing/consecutive dots), labels
/// longer than 63 bytes, and labels starting or ending with a hyphen.
pub fn validate_anchor_domain(domain: &Bytes) -> bool {
    let len = domain.len();
    if !(3..=MAX_DOMAIN_LEN).contains(&len) {
        return false;
    }

    let mut has_dot = false;
    let mut label_len: u32 = 0;
    let mut prev: Option<u8> = None;

    for c in domain.iter() {
        let is_alnum = c.is_ascii_alphanumeric();
        let is_dash = c == b'-';
        let is_dot = c == b'.';

        if !is_alnum && !is_dash && !is_dot {
            return false;
        }

        if is_dot {
            has_dot = true;
            if label_len == 0 || prev == Some(b'-') {
                return false;
            }
            label_len = 0;
        } else {
            if is_dash && label_len == 0 {
                return false;
            }
            label_len += 1;
            if label_len > MAX_LABEL_LEN {
                return false;
            }
        }

        prev = Some(c);
    }

    if label_len == 0 || prev == Some(b'-') {
        return false;
    }

    has_dot
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::Env;

    fn domain(env: &Env, s: &str) -> Bytes {
        Bytes::from_slice(env, s.as_bytes())
    }

    #[test]
    fn accepts_plausible_domains() {
        let env = Env::default();
        assert!(validate_anchor_domain(&domain(&env, "anchor.example.com")));
        assert!(validate_anchor_domain(&domain(&env, "a.co")));
        assert!(validate_anchor_domain(&domain(&env, "sub.multi-part.anchor.io")));
    }

    #[test]
    fn rejects_empty_and_oversized() {
        let env = Env::default();
        assert!(!validate_anchor_domain(&domain(&env, "")));

        let mut too_long_label = Bytes::from_slice(&env, &[b'a'; 64]);
        too_long_label.append(&domain(&env, ".com"));
        assert!(!validate_anchor_domain(&too_long_label));
    }

    #[test]
    fn rejects_missing_dot() {
        let env = Env::default();
        assert!(!validate_anchor_domain(&domain(&env, "localhost")));
    }

    #[test]
    fn rejects_leading_and_trailing_dots() {
        let env = Env::default();
        assert!(!validate_anchor_domain(&domain(&env, ".example.com")));
        assert!(!validate_anchor_domain(&domain(&env, "example.com.")));
    }

    #[test]
    fn rejects_consecutive_dots() {
        let env = Env::default();
        assert!(!validate_anchor_domain(&domain(&env, "example..com")));
    }

    #[test]
    fn rejects_hyphen_at_label_boundary() {
        let env = Env::default();
        assert!(!validate_anchor_domain(&domain(&env, "-example.com")));
        assert!(!validate_anchor_domain(&domain(&env, "example-.com")));
    }

    #[test]
    fn rejects_disallowed_characters() {
        let env = Env::default();
        assert!(!validate_anchor_domain(&domain(&env, "exa mple.com")));
        assert!(!validate_anchor_domain(&domain(&env, "example.com/path")));
        assert!(!validate_anchor_domain(&domain(&env, "exa_mple.com")));
    }
}
